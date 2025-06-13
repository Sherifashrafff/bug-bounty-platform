const path = require("path");

const serveStaticFiles = (app) => {
  app.use("/uploads", require("express").static(path.join(__dirname, "uploads")));
  app.use("/Backend/data", require("express").static(path.join(__dirname, "data")));
  app.use('/favicon.ico', require("express").static(path.join(__dirname, "../Researcher/favicon.ico")));

  const researcherPages = [
    "create-submission", "Engagements", "invites", "payments", "profile",
    "program", "report-detail", "reports"
  ];
  researcherPages.forEach(page => {
    app.get(`/Researcher/${page}.html`, (req, res) =>
      res.sendFile(path.join(__dirname, `../Researcher/${page}.html`))
    );
  });

  const clientPages = [
    "Reports", "Report-detail", "Payments", "create-program", "edit-program",
    "InviteHackers", "Orgprofile", "Program"
  ];
  clientPages.forEach(page => {
    app.get(`/Client/${page}.html`, (req, res) =>
      res.sendFile(path.join(__dirname, `../Client/${page}.html`))
    );
  });

  const adminPages = ["index", "report"];
  adminPages.forEach(page => {
    app.get(`/Admin/${page}.html`, (req, res) =>
      res.sendFile(path.join(__dirname, `../Admin/${page}.html`))
    );
  });

  const loginPages = ["login", "resetpassword", "landpage"];
  loginPages.forEach(page => {
    app.get(`/${page}`, (req, res) =>
      res.sendFile(path.join(__dirname, `../Login/${page}.html`))
    );
  });
};

module.exports = serveStaticFiles;
