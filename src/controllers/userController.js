import User from "../models/User";
import bcrypt from "bcrypt";
import fetch from "cross-fetch";

export const getJoin = (req, res) => {
  res.render("join", { pageTitle: "Join" });
};

export const postJoin = async (req, res) => {
  const { name, username, password, password2, email, location } = req.body;
  const pageTitle = "Join";

  // check error
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Password confirmation does not match.",
    });
  }

  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This username or email address is already taken.",
    });
  }

  try {
    await User.create({
      name,
      username,
      password,
      email,
      location,
      socialOnly: false,
      avatarUrl: "",
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: error._message,
    });
  }
};

export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";

  // check if username exist
  const user = await User.findOne({ username, socialOnly: false });
  if (!user)
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "An Account with this username does not exists.",
    });

  // check if password correct
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res
      .status(400)
      .render("login", { pageTitle, errorMessage: "Wrong password" });
  }

  req.session.loggedIn = true;
  req.session.user = user;

  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  const tokenResponse = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();

  if ("access_token" in tokenResponse) {
    const { access_token } = tokenResponse;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );

    if (!emailObj) {
      return res.redirect("/login");
    }

    // verifyied email exist
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      //create user
      user = await User.create({
        name: userData.name ? userData.name : userData.login,
        socialOnly: true,
        username: userData.login,
        email: emailObj.email,
        password: "",
        avatarUrl: userData.avatar_url,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const startKakaoLogin = (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/authorize";
  const config = {
    client_id: process.env.KA_CLIENT,
    redirect_uri: `http://localhost:4000/users/kakao/finish`,
    response_type: "code",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  return res.redirect(finalUrl);
};

export const finishKakaoLogin = async (req, res) => {
  const pageTitle = "Login";
  const baseUrl = "https://kauth.kakao.com/oauth/token";
  const config = {
    grant_type: "authorization_code",
    client_id: process.env.KA_CLIENT,
    redirect_uri: "http://localhost:4000/users/kakao/finish",
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  const tokenResponse = await (
    await fetch(finalUrl, {
      method: "POST",
    })
  ).json();

  // if access token exists
  if ("access_token" in tokenResponse) {
    const apiUrl = "https://kapi.kakao.com";
    const { access_token } = tokenResponse;

    // take user data
    const userToken = await (
      await fetch(`${apiUrl}/v1/user/access_token_info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json();

    // if userdata is unknown
    if (userToken.msg === "no authentication key!") {
      return res.render("login", {
        pageTitle,
        errorMessage: "no authentication key",
      });
    }

    // request user info
    const userData = await (
      await fetch(`${apiUrl}/v2/user/me`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          target_id_type: "user_id",
          target_id: userToken.id,
          Accept: "application/json",
        },
      })
    ).json();

    const kakaoAccount = userData.kakao_account;
    const kakaoProfile = kakaoAccount.profile;

    if (
      kakaoAccount.is_email_valid === false ||
      kakaoAccount.is_email_verified === false
    ) {
      return res.render("login", {
        pageTitle,
        errorMessage: "Email is not valid or not verifired",
      });
    }

    let user = await User.findOne({ email: kakaoAccount.email });
    if (!user) {
      user = await User.create({
        name: kakaoProfile.nickname,
        socialOnly: true,
        username: kakaoProfile.nickname,
        email: kakaoAccount.email,
        password: "",
        avatarUrl: kakaoProfile.profile_image_url,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

export const getEdit = (req, res) => {
  return res.render("user/edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
  const pageTitle = "Edit Profile";
  const {
    session: {
      user: {
        _id,
        avatarUrl,
        username: beforeName,
        email: beforeEmail,
        socialOnly,
      },
    },
    body: { name, username, email, location },
    file,
  } = req;

  // Social Login => error
  if (socialOnly && beforeEmail !== email) {
    return res.status(400).render("user/edit-profile", {
      pageTitle,
      errorMessage: "This ID(Social Login) cannot change email.",
    });
  }

  // Set Condition for Search User
  let searchCondition = [];
  if (beforeName !== username) searchCondition.push({ username });
  if (beforeEmail !== email) searchCondition.push({ email });

  if (searchCondition.length > 0) {
    if (await User.exists({ $or: searchCondition })) {
      return res.status(400).render("user/edit-profile", {
        pageTitle,
        errorMessage: "This username or email address is already taken.",
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.path : avatarUrl,
      name,
      username,
      email,
      location,
    },
    { new: true }
  );

  req.session.user = updatedUser;
  return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
  return res.render("user/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { oldPassword, newPassword, newPassword2 },
  } = req;

  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);

  if (!ok) {
    return res.status(400).render("user/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The current password is incorrect",
    });
  }

  // check new password
  if (newPassword !== newPassword2) {
    return res.status(400).render("user/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The password does not match the confirmation",
    });
  }

  user.password = newPassword;
  await user.save();
  // send notification

  req.session.destroy();
  return res.redirect("/login");
};

export const see = async (req, res) => {
  const { id } = req.params;
  if (id) {
    const user = await User.findById(id).populate("videos");
    console.log(user);
    if (!user) {
      return res.status(404).render("404", { pageTitle: "user not found" });
    }
    return res.render("user/profile", { pageTitle: user.name, user });
  }
};
