import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse"
import { ApiError } from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
    
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    if(!mongoose.isValidObjectId(videoId) || !videoId){
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    
     const comments =  Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {                      //to pass in full owner details while connecting the video
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {              //Can't pass Sensitive info
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                                        ownerDetails: { $first: "$ownerDetails" } //We put this here(I had prev assigned it in the User model nested pipeline) becuase of scope issues. The `owneerDetails` field belongs to the `Video` model not the `User` model , thus it can't be accessible there.
                        } 
                    }
                ],
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "watchHistory",
                            foreignField: "_id",
                            as: "watchHistoryDetails",
                        }
                    },
                    {
                        $addFields: {
                            watchHistoryDetails: { $first: "$watchHistoryDetails" }
                        }
                    }
                ]
            }
        },            
    ])

    const {page = 1, limit = 10} = req.query
    
    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
    }

    const result = await Comment.aggregatePaginate(comments, options)

   if(!result ){
    throw new ApiError(404, "Error while fetching comments")
   }

   return res.status(200).json(new ApiResponse(200,result,"Comments fetched successfully"))


    

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
