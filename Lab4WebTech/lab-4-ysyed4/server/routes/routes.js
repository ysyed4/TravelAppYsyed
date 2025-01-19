const express = require("express");
const User = require("../models/user");
const Destination = require("../models/destination");
const List = require("../models/list");
const Review = require("../models/review");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const stringSimilarity = require("string-similarity");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

router.post("/users/register", async (req, res) => {
  const { email, password, nickname } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "1d",
    });
    const user = new User({
      email,
      password: hashedPassword,
      nickname,
      verified: false,
      verificationToken,
    });

    const savedUser = await user.save();

    const verificationLink = `http://localhost:3000/api/users/verify/${verificationToken}`;

    res.status(201).json({
      message: "Registration Successful, Please verify email!",
      verificationLink,
      user: {
        _id: savedUser._id,
        email: savedUser.email,
        nickname: savedUser.nickname,
        verified: savedUser.verified,
        roles: savedUser.roles,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/users/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found.");
      return res.status(400).json({ message: "User not found." });
    }

    user.verified = true;
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully, please log in" });
  } catch (error) {
    console.error("Error during email verification:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "Verification token has expired. Please register again.",
      });
    }
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.verified) {
      return res.status(400).json({ message: "Please verify email!" });
    }
    if (user.disabled) {
      return res
        .status(400)
        .json({
          message:
            "Your account is disabled. Please contact admin or site manager.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Passwords do not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        roles: user.roles,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        nickname: user.nickname,
        verified: user.verified,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/destinations", async (req, res) => {
  const destination = new Destination({
    name: req.body.name,
    region: req.body.region,
    country: req.body.country,
    category: req.body.category,
    coordinates: req.body.coordinates,
    currency: req.body.currency,
    language: req.body.language,
    safety: req.body.safety,
    description: req.body.safety,
  });
  try {
    const destinationsToSave = await destination.save();
    res.status(200).json(destinationsToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/lists", async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied, No token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied, invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const { name, description, destinations, visibility } = req.body;

    const list = new List({
      name,
      description,
      destinations,
      visibility,
      owner: decoded.userId,
    });

    const savedList = await list.save();
    res.status(201).json(savedList);
  } catch (error) {
    console.error("Error creating list:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.post("/lists/:id/reviews", async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token payload" });
    }

    const { rating, comment } = req.body;
    const listId = req.params.id;

    const list = await List.findById(listId).populate("reviews");
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newReview = new Review({
      rating,
      comment,
      user: userId,
      list: listId,
      userName: user.nickname,
      createdAt: new Date(),
    });

    const savedReview = await newReview.save();

    list.reviews.push(savedReview._id);

    const reviews = await Review.find({ _id: { $in: list.reviews } });
    const totalRatings = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    list.averageRating = (totalRatings / reviews.length).toFixed(1);
    await list.save();

    res
      .status(201)
      .json({ message: "Review added successfully", review: savedReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/reviews/:id", async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token payload" });
    }

    const reviewId = req.params.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this review",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/lists/:listId/details", async (req, res) => {
  try {
    const listId = req.params.listId;

    const list = await List.findById(listId)
      .populate({
        path: "reviews",
        model: "Review",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "user",
          model: "User",
          select: "nickname",
        },
      })
      .populate("owner", "nickname");

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching list details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const data = await User.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const data = await User.findById(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };

    const result = await User.findByIdAndUpdate(id, updatedData, options);
    res.send(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await User.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }

    res.status(200).json({
      message: `User with nickname ${data.nickname} has been deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/destinations", async (req, res) => {
  try {
    const data = await Destination.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/destinations/:id", async (req, res) => {
  try {
    const data = await Destination.findById(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/destinations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };

    const result = await Destination.findByIdAndUpdate(
      id,
      updatedData,
      options
    );
    res.send(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/destinations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Destination.findByIdAndDelete(id);
    res.send(`Destination with name ${data.name} has been deleted`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/lists", async (req, res) => {
  try {
    const data = await List.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/lists/:id", async (req, res) => {
  try {
    const data = await List.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "List not found" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/lists/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };

    const result = await List.findByIdAndUpdate(id, updatedData, options);
    res.send(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/lists/:id", async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token payload" });
    }

    const listId = req.params.id;

    const list = await List.findById(listId);

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    if (list.owner.toString() !== userId) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this list",
      });
    }

    await List.findByIdAndDelete(listId);

    res
      .status(200)
      .json({ message: `List with name ${list.name} has been deleted` });
  } catch (error) {
    console.error("Error deleting list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/make-admin/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.roles.includes("admin")) {
      user.roles.push("admin");
    }

    await user.save();
    res
      .status(200)
      .json({ message: "User has been granted admin privileges", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/admin/users/:id/roles", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, action } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (action === "add") {
      if (!user.roles.includes(role)) {
        user.roles.push(role);
      }
    } else if (action === "remove") {
      if (user.roles.includes(role)) {
        user.roles = user.roles.filter((existingRole) => existingRole !== role);
      }
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await user.save();
    res.status(200).json({
      message: `Role "${role}" ${
        action === "add" ? "granted to" : "removed from"
      } user "${user.nickname}"`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/admin/reviews/:id/hidden", async (req, res) => {
  try {
    const { id } = req.params;
    const { hidden } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.hidden = hidden;
    await review.save();

    res.status(200).json({
      message: `Review visibility updated to: ${hidden ? "hidden" : "visible"}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/admin/users/:id/disable", async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.disabled = disabled;
    await user.save();

    res.status(200).json({
      message: `User "${user.nickname}" has been ${
        disabled ? "disabled" : "enabled"
      }`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/guest/destinations", async (req, res) => {
  try {
    const { name = "", region = "", country = "" } = req.query;

    console.log("Received query parameters:", { name, region, country });

    const regexOptions = { $regex: ".*", $options: "i" };
    const filters = {};

    if (name) {
      filters.Destination = { ...regexOptions, $regex: name };
    }
    if (region) {
      filters.Region = { ...regexOptions, $regex: region };
    }
    if (country) {
      filters.Country = { ...regexOptions, $regex: country };
    }

    let destinations = await Destination.find(filters);

    destinations = destinations.map((destination) => ({
      ...destination._doc,

      coordinates: {
        latitude: destination.coordinates?.latitude ?? null,
        longitude: destination.coordinates?.longitude ?? null,
      },

      currency: destination.Currency || "Unknown Currency",
      language: destination.Language || "Unknown Language",
      safety: destination.Safety || "Unknown Safety Info",
      description: destination.Description || "No Description Available",
    }));

    res.status(200).json(destinations);
  } catch (error) {
    console.error("Error fetching destinations for guest:", error);
    res.status(500).json({ message: "Error fetching destinations" });
  }
});

router.get("/public-lists", async (req, res) => {
  try {
    const publicLists = await List.find({ visibility: "public" })
      .sort({ lastModified: -1 })
      .limit(10)
      .populate("owner", "nickname")
      .populate({
        path: "destinations",
        select:
          "Destination Region Country Category Latitude Longitude Currency Language Safety Description",
        transform: (doc) => ({
          ...doc.toObject(),
          coordinates: {
            latitude: doc.Latitude || null,
            longitude: doc.Longitude || null,
          },
        }),
      })
      .populate({
        path: "reviews",
        model: "Review",
        match: { hidden: false },
        select: "rating comment createdAt hidden",
        populate: {
          path: "user",
          model: "User",
          select: "nickname",
        },
      });

    const formattedLists = publicLists.map((list) => {
      const visibleReviews = list.reviews.filter((review) => !review.hidden);
      const averageRating =
        visibleReviews.length > 0
          ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) /
            visibleReviews.length
          : 0;

      return {
        _id: list._id,
        name: list.name,
        description: list.description,
        creatorId: list.owner._id,
        creatorNickname: list.owner?.nickname || "Unknown",
        numDestinations: list.destinations.length,
        destinations: list.destinations,
        averageRating: averageRating.toFixed(1),
        reviews: visibleReviews,
        lastModified: list.lastModified,
      };
    });

    res.status(200).json(formattedLists);
  } catch (error) {
    console.error("Error fetching public lists:", error);
    res
      .status(500)
      .json({ message: "Error fetching public destination lists" });
  }
});

router.get("/private-lists", async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Access denied, No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied, invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const privateLists = await List.find({
      owner: decoded.userId,
      visibility: "private",
    })
      .sort({ lastModified: -1 })
      .populate({
        path: "destinations",
        select:
          "Destination Region Country Category Latitude Longitude Currency Language Safety Description",
        transform: (doc) => ({
          ...doc.toObject(),
          coordinates: {
            latitude: doc.Latitude || null,
            longitude: doc.Longitude || null,
          },
        }),
      });

    const formattedLists = privateLists.map((list) => ({
      _id: list._id,
      name: list.name,
      description: list.description,
      numDestinations: list.destinations.length,
      destinations: list.destinations,
      lastModified: list.lastModified,
    }));

    res.status(200).json(formattedLists);
  } catch (error) {
    console.error("Error fetching private lists:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Error fetching private lists" });
  }
});
router.get("/admin/public-lists", async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.roles.includes("admin")) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const publicLists = await List.find({ visibility: "public" })
      .sort({ lastModified: -1 })
      .limit(10)
      .populate("owner", "nickname")
      .populate({
        path: "destinations",
        select:
          "Destination Region Country Category Latitude Longitude Currency Language Safety Description",
        transform: (doc) => ({
          ...doc.toObject(),
          coordinates: {
            latitude: doc.Latitude || null,
            longitude: doc.Longitude || null,
          },
        }),
      })
      .populate({
        path: "reviews",
        model: "Review",
        select: "rating comment createdAt hidden",
        populate: {
          path: "user",
          model: "User",
          select: "nickname",
        },
      });

    const formattedLists = publicLists.map((list) => {
      const averageRating =
        list.reviews.length > 0
          ? list.reviews.reduce((sum, review) => sum + review.rating, 0) /
            list.reviews.length
          : 0;

      return {
        _id: list._id,
        name: list.name,
        description: list.description,
        creatorId: list.owner._id,
        creatorNickname: list.owner?.nickname || "Unknown",
        numDestinations: list.destinations.length,
        destinations: list.destinations,
        averageRating: averageRating.toFixed(1),
        reviews: list.reviews,
        lastModified: list.lastModified,
      };
    });

    res.status(200).json(formattedLists);
  } catch (error) {
    console.error("Error fetching public lists for admin:", error);
    res
      .status(500)
      .json({ message: "Error fetching public destination lists" });
  }
});

module.exports = router;
