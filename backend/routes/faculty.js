const express = require("express");
const router = express.Router();
const {
  getAllFaculty,
  createFaculty,
  updateFaculty,
} = require("../controllers/facultyController");

router.get("/", getAllFaculty);
router.post("/", createFaculty);
router.put("/:id", updateFaculty);

module.exports = router;