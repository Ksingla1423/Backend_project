import mongoose, { Schema } from "mongoose";

const Postsschema = new Schema({
  content: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  },
  comment: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Comment"
    }
  ],
  likeby: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User"
    }
  ]
}, { timestamps: true });

export const Posts = mongoose.model("Posts", Postsschema);
