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
    req.flash("error", "Password confirmation does not match.");
    return res.status(400).render("join", { pageTitle });
  }

  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    req.flash("error", "This username or email address is already taken.");
    return res.status(400).render("join", { pageTitle });
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
    req.flash("error", error._message);
    return res.status(400).render("join", { pageTitle: "Join" });
  }
};

export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";

  // check if username exist
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    req.flash("error", "An Account with this username does not exists.");
    return res.status(400).render("login", { pageTitle });
  }

  // check if password correct
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    req.flash("error", "Wrong password!");
    return res.status(400).render("login", { pageTitle });
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
    await fetch(finalUrl, { method: "POST" })
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
      req.flash("error", "No authentication key!");
      return res.render("login", {
        pageTitle,
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
      req.flash("error", "Email is not valid or not verifired.");
      return res.render("login", { pageTitle });
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
  req.flash("info", "Bye Bye");
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
    req.flash("error", "This ID(Social Login) cannot change email.");
    return res.status(400).render("user/edit-profile", { pageTitle });
  }

  // Set Condition for Search User
  let searchCondition = [];
  if (beforeName !== username) searchCondition.push({ username });
  if (beforeEmail !== email) searchCondition.push({ email });

  if (searchCondition.length > 0) {
    if (await User.exists({ $or: searchCondition })) {
      req.flash("error", "This username or email address is already taken.");
      return res.status(400).render("user/edit-profile", { pageTitle });
    }
  }
  req.flash("info", "asdf");
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file
        ? req.session.isHeroku
          ? file.location
          : file.path
        : avatarUrl,
      name,
      username,
      email,
      location,
    },
    { new: true }
  );

  req.session.user = updatedUser;
  req.flash("info", "Profile Update");
  return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Can't change password.");
    return res.redirect("/");
  }
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
    req.flash("error", "The current password is incorrect.");
    return res
      .status(400)
      .render("user/change-password", { pageTitle: "Change Password" });
  }

  // check new password
  if (newPassword !== newPassword2) {
    req.flash("error", "The password does not match the confirmation.");
    return res
      .status(400)
      .render("user/change-password", { pageTitle: "Change Password" });
  }

  user.password = newPassword;
  await user.save();
  // send notification
  req.flash("info", "Password updated");
  req.session.destroy();
  return res.redirect("/login");
};

export const see = async (req, res) => {
  const { id } = req.params;
  if (id) {
    const user = await User.findById(id).populate({
      path: "videos",
      populate: {
        path: "owner",
        model: "User",
      },
    });
    if (!user) {
      return res.status(404).render("404", { pageTitle: "User not found" });
    }
    return res.render("user/profile", { pageTitle: user.name, user });
  }
};
