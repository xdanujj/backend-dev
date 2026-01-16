import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import jwt  from "jsonwebtoken";
import { User } from "../models/user.models.js";

try {
  const verifyJWT = asyncHandler(async (req, _, next) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorised Access");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findbyId(decodedToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  });
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid access Token")
}

export { verifyJWT };
