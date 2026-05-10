import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  birthYear: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  verificationId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hasVoted: { type: Boolean, default: false },
  failedAttempts: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  photo: { type: String },
  role: { type: String, enum: ['user', 'candidate', 'admin', 'delegate'], default: 'user' },
  candidateAuthAttempts: { type: Number, default: 0 },
  isCandidateBanned: { type: Boolean, default: false },
  partyId: { type: String },
  region: { type: String },
  delegatePower: { type: Number, default: 1 }
});

const CandidateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  partyId: { type: String, required: true },
  symbol: { type: String, required: true },
  bio: { type: String },
  platform: [{ type: String }],
  photo: { type: String },
  region: { type: String }
});

const BlockSchema = new mongoose.Schema({
  index: { type: Number, required: true, unique: true },
  timestamp: { type: String, required: true },
  vote: {
    voterId: { type: String, required: true },
    candidateId: { type: String, required: true },
    region: { type: String, required: true },
    weight: { type: Number, required: true }
  },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true }
});

const AuditEntrySchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  level: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'urgent', 'success'], default: 'info' }
});

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const FeedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: String, required: true }
});

export const UserModel = mongoose.model('User', UserSchema);
export const CandidateModel = mongoose.model('Candidate', CandidateSchema);
export const BlockModel = mongoose.model('Block', BlockSchema);
export const AuditEntryModel = mongoose.model('AuditEntry', AuditEntrySchema);
export const NotificationModel = mongoose.model('Notification', NotificationSchema);
export const SettingsModel = mongoose.model('Settings', SettingsSchema);
export const FeedbackModel = mongoose.model('Feedback', FeedbackSchema);
