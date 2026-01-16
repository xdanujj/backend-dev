import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens=async (userId) => {
  try {
    const user = await User.findbyId(userId);
    const accessToken= await user.generateAccessToken();
    const refreshToken= await user.generateRefreshToken();
    user.refreshToken= refreshToken;
    await user.save({validateBeforeSave:false});
    return {accessToken,refreshToken};
    
  } catch (error) {
    throw new ApiError(500,"Server Issue");
  }  
}

const registerUser = asyncHandler(async (req, res) => {
  console.log(req.body);
  console.log(req.files);
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
  let coverImagePath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path;

  } 
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

const loginUser=asyncHandler(async(req,res)=>{
  //1.Take data from frontend
  //2.Validate whether fields are filled or not
  //3.Check whether entered email already exists in db or not or also if verified or not
  //Also check if entered password matches the password set
  //4.if successfull show home page etc
  const {email,password,username}=req.body;
  if(!email||!username){
    throw new ApiError(400,"Username or Email is required!");
  }
  const user=await User.findOne({
    $or:[{username},{email}]
  })
  if(!user){
    throw new ApiError(404,"User does not exist");
  }
  const isPasswordValid=await user.isPasswordCorrect(password);
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid User Credentials!");
  }

  const{accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id);

  const loggedInUser=await User.findById(user._id).select("-password","-refreshToken");
  
  const options={
    httpOnly:true,
    secure:true
  }
  return res.
  status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,accessToken,refreshToken
      },
      "User Logged In Successfully"
    )
  )

})

const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    },
    
  )
    const options={
    httpOnly:true,
    secure:true
  }
  return res.
  status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out!"))
})

export {registerUser,loginUser,logoutUser};
