import mongoose, { Schema } from "mongoose";

import {
  NotesPermissionsEnum,
  AvailableNotesPermissions,
} from "../utils/constants";

const projectNoteMembershipSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  permissionLevel: {
    type: String,
    enum: AvailableNotesPermissions,
    required: true,
    default: NotesPermissionsEnum.READ,
  },
});

export const projectNoteMembership = mongoose.model(
  "projectNoteMembership",
  projectNoteMembershipSchema,
);
