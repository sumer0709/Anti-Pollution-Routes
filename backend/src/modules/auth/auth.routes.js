const router = require("express").Router();

const controller = require("./auth.controller");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post('/logout', controller.logout);
router.post('/refreshToken' , controller.refreshToken);

module.exports = router;