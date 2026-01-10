import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  // ✅ Proper empty field validation
  if ([fullName, username, email, password].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // ✅ Check existing user
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  // ✅ Safe optional chaining
  const avatarPath = req.files?.avatar?.[0]?.path;
  const coverImagePath = req.files?.coverImage?.[0]?.path;

  if (!avatarPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // ✅ Upload avatar
  const avatar = await uploadOnCloudinary(avatarPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // ✅ Upload cover image only if exists
  let coverImage = null;
  if (coverImagePath) {
    coverImage = await uploadOnCloudinary(coverImagePath);
  }

  // ✅ Create user (password hashing handled in model)
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
});

export {registerUser};
