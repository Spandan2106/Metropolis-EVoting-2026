import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { 
  UserModel, 
  CandidateModel, 
  BlockModel, 
  AuditEntryModel, 
  NotificationModel,
  SettingsModel,
  FeedbackModel
} from './mongoose_models';

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI not found. App will use in-memory fallbacks until configured.');
} else {
  mongoose.connect(MONGODB_URI!, {
    maxPoolSize: 1000, // Expanded pool to handle 1000 concurrent users
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// --- Types ---
interface Block {
  index: number;
  timestamp: string;
  vote: {
    voterId: string;
    candidateId: string;
    region: string;
    weight: number;
  };
  previousHash: string;
  hash: string;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  details: string;
  level: 'info' | 'warning' | 'danger';
}

interface User {
  id: string;
  name: string;
  birthYear: string;
  email: string;
  phone: string;
  address: string;
  verificationId: string;
  password: string;
  hasVoted: boolean;
  failedAttempts: number;
  isBanned: boolean;
  photo?: string;
  role: 'user' | 'candidate' | 'admin' | 'delegate';
  candidateAuthAttempts: number;
  isCandidateBanned: boolean;
  partyId?: string;
  region: string;
  delegatePower?: number; // Weighted vote multiplier
}

const regions = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5'];

interface Party {
  id: string;
  name: string;
  symbol: string;
  securityKey: string;
}

const parties: Record<string, Party> = {
  'republican': { id: 'republican', name: 'Republican Party', symbol: '🐘', securityKey: 'REP_SECURE_2026' },
  'democrat': { id: 'democrat', name: 'Democrat Party', symbol: '🐴', securityKey: 'DEM_SECURE_2026' },
  'liberal': { id: 'liberal', name: 'Liberal Party', symbol: '🗽', securityKey: 'LIB_SECURE_2026' },
  'socialdem': { id: 'socialdem', name: 'Social Democrats Party', symbol: '🌹', securityKey: 'SD_SECURE_2026' },
  'communist': { id: 'communist', name: 'Communist Party', symbol: '⚒️', securityKey: 'COM_SECURE_2026' },
  'socialist': { id: 'socialist', name: 'Socialist Party', symbol: '✊', securityKey: 'SOC_SECURE_2026' },
  'leftist': { id: 'leftist', name: 'Left Wing Party', symbol: '⬅️', securityKey: 'LEFT_SECURE_2026' },
  'rightist': { id: 'rightist', name: 'Right Wing Party', symbol: '➡️', securityKey: 'RIGHT_SECURE_2026' },
  'nota': { id: 'nota', name: 'None of the Above', symbol: '🚫', securityKey: 'NONE' },
  'independent': { id: 'independent', name: 'Independent', symbol: '#', securityKey: 'NONE' }
};

interface Candidate {
  id: string;
  name: string;
  party: string;
  partyId: string;
  symbol: string;
  bio: string;
  platform: string[];
  photo: string;
  region: string;
}

// --- Configuration ---
// Change this to 1 to revert to standard 1-person-1-vote counting.
// Current setting: 100 (Each vote counts as 100 in the system).
const VOTE_MULTIPLIER = 75000;

const initialCandidates: Candidate[] = [
  { id: 'c1', name: 'J. Vance', party: 'Republican Party', partyId: 'republican', symbol: '🐘', bio: 'A seasoned diplomat focusing on economic sovereignty.', platform: ['Lower digital transaction taxes', 'Strengthen node infrastructure', 'Energy independence via fusion'], photo: 'https://images.unsplash.com/photo-1540560086596-6f4528bedb02?w=400&h=400&fit=crop', region: 'Sector 1' },
  { id: 'c2', name: 'Elena Smitch', party: 'Democrat Party', partyId: 'democrat', symbol: '🐴', bio: 'Advocate for digital rights and social connectivity.', platform: ['Universal high-speed uplink', 'Privacy preservation laws', 'Education decentralization'], photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', region: 'Sector 2' },
  { id: 'c3', name: 'Lean Dean', party: 'Liberal Party', partyId: 'liberal', symbol: '🗽', bio: 'Entrepreneurial spirit focused on open markets.', platform: ['Deregulate digital assets', 'Reduce firewall restrictions', 'Innovation grants for startups'], photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', region: 'Sector 3' },
  { id: 'c4', name: 'Sarah Jenkins', party: 'Social Democrats Party', partyId: 'socialdem', symbol: '🌹', bio: 'Committed to equitable distribution of resources.', platform: ['Universal Basic Income via smart contracts', 'Public health node expansion', 'Labor unions for gig-economy workers'], photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', region: 'Sector 4' },
  { id: 'c5', name: 'Viktor Knight', party: 'Communist Party', partyId: 'communist', symbol: '⚒️', bio: 'Worker control of the digital means of production.', platform: ['Nationalize all server farms', 'Abolish digital private property', 'Planned algorithmic economy'], photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', region: 'Sector 5' },
  { id: 'c6', name: 'Maria Garcia', party: 'Socialist Party', partyId: 'socialist', symbol: '✊', bio: 'Community-driven governance and localized power.', platform: ['District-level decision making', 'Co-operative digital platforms', 'Green energy mandates for data centers'], photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', region: 'Sector 3' },
  { id: 'c7', name: 'Ahmed Hassan', party: 'Left Wing Party', partyId: 'leftist', symbol: '⬅️', bio: 'Advocate for progressive policies and social justice.', platform: ['Universal healthcare access', 'Climate change mitigation', 'Cultural preservation initiatives'], photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', region: 'Sector 4' },
  { id: 'c10', name: 'Marcus Aurelius', party: 'Independent', partyId: 'independent', symbol: '🏛️', bio: 'Stoic leadership for a chaotic era.', platform: ['Focus on civic virtue', 'Digital literacy campaigns', 'Mental health support systems'], photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', region: 'Sector 2' },
  { id: 'nota', name: 'None of the Above', party: 'None of the Above', partyId: 'nota', symbol: '🚫', bio: 'Abstain and demand better representation.', platform: ['Protest vote', 'Demand electoral reform', 'Support direct democracy'], photo: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=400&fit=crop', region: 'Sector 1' }
];

// Settings Helpers
async function getSetting(key: string, defaultValue: any) {
  const setting = await SettingsModel.findOne({ key });
  return setting ? setting.value : defaultValue;
}

async function setSetting(key: string, value: any) {
  await SettingsModel.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
}

// Helper to seed data
const seedDatabase = async () => {
  const forceReseed = process.env.FORCE_DB_RESEED === 'true';
  console.log(`🚀 Initializing Database (Mode: ${forceReseed ? 'FORCE RESEED' : 'Fast Startup'})...`);

  if (forceReseed) {
    console.log('🧹 Performing full system wipe as requested by FORCE_DB_RESEED...');
    await BlockModel.deleteMany({}); // Deletes all blocks, including genesis
    await AuditEntryModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await SettingsModel.deleteMany({});
    await CandidateModel.deleteMany({}); // Also wipe candidates if full reseed
    await UserModel.deleteMany({}); // Also wipe users if full reseed
  } else {
    // In Fast Startup mode, always clear votes and reset user voting status for a fresh election simulation
    console.log('🧹 Clearing previous voting data, resetting user voting status, audit logs, and notifications...');
    await BlockModel.deleteMany({ index: { $gt: 0 } }); // Delete all blocks except genesis
    await UserModel.updateMany({}, { hasVoted: false }); // Reset all users' voting status
    await AuditEntryModel.deleteMany({}); // Clear audit logs too for a clean slate
    await NotificationModel.deleteMany({}); // Clear notifications too
  }

  // Seed eligible voters setting
  if (forceReseed || !(await SettingsModel.findOne({ key: 'eligibleVoters' }))) {
    await setSetting('eligibleVoters', 6000000);
  }

  // Seed initial notifications if empty
  const notifCount = await NotificationModel.countDocuments();
  if (notifCount === 0) {
    console.log('Seeding initial notifications...');
    await NotificationModel.insertMany([
      { id: '1', timestamp: new Date().toISOString(), title: 'Protocol ', message: 'EVoting  for Mayor Election 2026 is officially online.', type: 'info' },
      { id: '2', timestamp: new Date().toISOString(), title: 'Registration Deadline', message: 'Participation window closes soon. Verify your identity immediately.', type: 'urgent' }
    ]);
  }

  // Seed candidates
  let candCount = await CandidateModel.countDocuments();
  if (forceReseed || candCount === 0) {
    if (forceReseed) {
      console.log('Force re-seeding candidates...');
      await CandidateModel.deleteMany({});
    } else {
      console.log('Seeding initial candidates (collection was empty)...');
    }
    await CandidateModel.insertMany(initialCandidates);
  } else {
    console.log(`Candidates already exist (${candCount} found), skipping re-seed.`);
  }

  // Seed users
  let userCount = await UserModel.countDocuments();
  if (forceReseed || userCount < 100) { // Re-seed if forced, or if less than 100 users (to ensure sufficient test data)
    if (forceReseed) {
      console.log('Force re-seeding users...');
      await UserModel.deleteMany({});
    } else if (userCount === 0) {
      console.log('Seeding initial users (collection was empty)...');
    } else { // userCount > 0 but < 100
      console.log(`Users found (${userCount}), but less than 100. Re-seeding to ensure sufficient test data.`);
      await UserModel.deleteMany({}); // Clear existing to re-seed to 1000
    }

    const names = ["Liam", "Noah", "Oliver", "James", "Elijah", "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett", "Victoria", "Madison", "Luna", "Grace", "Chloe", "Penelope", "Layla", "Riley", "Zoey", "Nora", "Lily", "Eleanor", "Hannah", "Lillian", "Addison", "Aubrey", "Ellie", "Stella", "Natalie", "Zoe", "Leah", "Hazel", "Violet", "Aurora", "Savannah", "Audrey", "Brooklyn", "Bella", "Claire", "Skylar", "Lucy", "Paisley", "Everly", "Anna", "Caroline", "Nova", "Genesis", "Emilia", "Kennedy", "Samantha", "Maya", "Willow", "Kinsley", "Naomi", "Aaliyah", "Elena", "Sarah", "Ariana", "Allison", "Gabriella", "Alice", "Madelyn", "Cora", "Ruby", "Eva", "Serenity", "Autumn", "Adeline", "Hailey", "Gianna", "Valentina", "Isla", "Eliana", "Quinn", "Nevaeh", "Ivy", "Sadie", "Piper", "Lydia", "Alexa", "Josephine", "Emery", "Julia", "Delilah", "Arianna", "Vivian"];

    const userDocs = [];
    for (let i = 0; i < 1000; i++) {
        const name = names[i % names.length];
        const id = `${name.toLowerCase()}${i}`;
        const birthYear = (1960 + (i % 45)).toString();
        const psw = `${id}${birthYear}`;
        
        userDocs.push({
          id,
          name,
          birthYear,
          password: psw,
          email: `${id}@election.org`,
          phone: `+1-555-010-${(1000+i).toString().slice(-4)}`,
          address: `${i} Digital Block Ave`,
          verificationId: `V-${i}X${Math.floor(Math.random()*999)}`,
          hasVoted: false,
          failedAttempts: 0,
          isBanned: false,
          role: 'user',
          photo: `https://i.pravatar.cc/150?u=${id}`,
          candidateAuthAttempts: 0,
          isCandidateBanned: false,
          partyId: 'none',
          region: regions[i % regions.length]
        });
    }

    // specific test user
    userDocs.push({ 
        id: 'john123', name: 'John Doe', birthYear: '2000', email: 'john@example.com', phone: '9876543210', address: '123 Election Ave', verificationId: '1234-5678-9012', password: 'john1232000', hasVoted: false, failedAttempts: 0, isBanned: false, role: 'user', candidateAuthAttempts: 0, isCandidateBanned: false, photo: '', region: 'Neon City' 
    });

    try {
      await UserModel.insertMany(userDocs, { ordered: false });
    } catch (e: any) {
      if (e.code === 11000) { // Duplicate key error
        console.warn('Some users already exist, skipping duplicates.');
      } else {
        console.error('Error seeding users:', e);
      }
    }
  } else {
    console.log(`Users already exist (${userCount} found), skipping re-seed.`);
  }

  // Create genesis block if blockchain empty
  const blockCount = await BlockModel.countDocuments();
  if (blockCount === 0) {
    console.log('Creating genesis block...');
    const timestamp = new Date().toISOString();
    const vote = { voterId: 'system', candidateId: 'genesis', region: 'Core', weight: 0 };
    const hash = calculateHash(0, timestamp, vote, '0');
    await BlockModel.create({
      index: 0,
      timestamp,
      vote,
      previousHash: '0',
      hash
    });
  } else {
    console.log(`Genesis block already exists (${blockCount} blocks found), skipping creation.`);
  }
  console.log('Database initialization complete.');
};

const ADMIN_CREDENTIALS = {
  id: 'admin123',
  password: 'admin1232026'
};

// --- Blockchain Logic ---
function calculateHash(index: number, timestamp: string, vote: any, previousHash: string): string {
  const str = index + timestamp + JSON.stringify(vote) + previousHash;
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function addVoteToChain(voterId: string, candidateId: string, region: string, weight: number = 1) {
  const previousBlock = await BlockModel.findOne().sort({ index: -1 });
  if (!previousBlock) return;
  
  const index = previousBlock.index + 1;
  const timestamp = new Date().toISOString();
  const vote = { voterId: 'ANONYMOUS_' + crypto.randomBytes(4).toString('hex'), candidateId, region, weight };
  const hash = calculateHash(index, timestamp, vote, previousBlock.hash);
  
  await BlockModel.create({
    index,
    timestamp,
    vote,
    previousHash: previousBlock.hash,
    hash
  });
  addAuditEntry(`Vote cast successfully`, `Thanks for using the Voting-Rights`, 'info');
  
  // Broadcast results update with debouncing to prevent thundering herd
  broadcastResultsUpdate();
}

let streamClients: any[] = [];

let resultsUpdateTimeout: NodeJS.Timeout | null = null;

function broadcastToAll(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  streamClients.forEach(c => {
    try { c.write(message); } catch (e) { /* ignore closed */ }
  });
}

function broadcastResultsUpdate() {
  if (resultsUpdateTimeout) return;
  resultsUpdateTimeout = setTimeout(() => {
    broadcastToAll('results', { update: true });
    resultsUpdateTimeout = null;
  }, 1000); // Wait 1 second before broadcasting to aggregate multiple votes
  
  // Invalidate caches on new vote
  clearCaches();
}

let statsCache: any = null;
let resultsCache: any = null;
function clearCaches() { statsCache = null; resultsCache = null; }

async function addAuditEntry(action: string, details: string, level: 'info' | 'warning' | 'danger') {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    action,
    details,
    level
  };
  await AuditEntryModel.create(entry);
  broadcastToAll('audit', entry);
}

// --- Express App ---
async function startServer() {
  const app = express();
  app.use(express.json());
  
  // Global Rate Limiter: 100,000 requests per 15 minutes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100000,
    message: { error: 'High traffic detected. Central identity node is throttling requests.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  const PORT = process.env.PORT || 3000;

  // Routes
  app.post('/api/login', async (req, res) => {
    const { userId: rawUserId, password } = req.body;
    if (!rawUserId || !password) return res.status(400).json({ error: 'Username and Password are required.' });
    
    const userId = rawUserId.toString().trim();
    if (userId === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
      await addAuditEntry('Admin Login', 'Administrator logged in', 'info');
      return res.json({ role: 'admin', user: { id: userId, name: 'Administrator' } });
    }

    const user = await UserModel.findOne({ id: userId });
    if (!user) return res.status(401).json({ error: 'Invalid credentials or user not registered.' });
    
    const isVotingOpen = await getSetting('isVotingOpen', true);
    if (!isVotingOpen && user.role !== 'admin') {
      return res.status(403).json({ error: 'THE ELECTION PORTAL IS CURRENTLY OFFLINE. NON-ADMIN ACCESS DENIED.' });
    }

    if (user.isBanned) return res.status(403).json({ error: 'Your account is PERMANENTLY BANNED due to security policy violations (Multiple Failed Logic Attempts).' });

    if (user.password === password) {
      user.failedAttempts = 0;
      await user.save();
      await addAuditEntry('User Login', `User ${userId} logged in`, 'info');
      return res.json({ role: user.role, user: { id: user.id, name: user.name, hasVoted: user.hasVoted } });
    } else {
      user.failedAttempts++;
      if (user.failedAttempts >= 10) {
        user.isBanned = true;
      }
      await user.save();
      
      if (user.isBanned) {
        await addAuditEntry('Security Alert', `User ${userId} banned after 10 failed attempts`, 'danger');
        return res.status(403).json({ error: 'Your account is PERMANENTLY BANNED due to security policy violations.' });
      }
      const attemptsLeft = 10 - user.failedAttempts;
      return res.status(401).json({ 
        error: 'Invalid credentials.', 
        warning: attemptsLeft <= 2 ? `CRITICAL WARNING: ${attemptsLeft} attempts remaining before PERMANENT BAN.` : null,
        attemptsLeft 
      });
    }
  });

  const registrationAttempts = new Map<string, number>();
  const bannedCandidateEmails = new Set<string>();

  app.post('/api/register', async (req, res) => {
    const { fullName, email, dob, phone, address, verificationId, role, partyId, partyKey, photo, symbol, region } = req.body;
    
    if (bannedCandidateEmails.has(email)) {
      return res.status(403).json({ error: 'YOUR IDENTITY IS PERMANENTLY BANNED FROM POLITICAL STATUS DUE TO MULTIPLE AUTHORIZATION FAILURES.' });
    }

    const existing = await UserModel.findOne({ verificationId });
    if (existing) return res.status(400).json({ error: 'THIS GOVERNMENT ID IS ALREADY REGISTERED IN THE EVoting System.' });

    const birthDate = new Date(dob);
    const today = new Date('2026-05-02');
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 18) {
      return res.status(400).json({ error: 'ELIGIBILITY DENIED: YOU MUST BE 18 YEARS OR OLDER TO REGISTER.' });
    }

    if ((role === 'candidate' || role === 'delegate') && partyId !== 'independent' && partyId !== 'nota') {
      const party = parties[partyId];
      if (party.securityKey !== partyKey) {
        const attempts = (registrationAttempts.get(email) || 0) + 1;
        registrationAttempts.set(email, attempts);
        
        if (attempts >= 3) {
          bannedCandidateEmails.add(email);
          await addAuditEntry('Identity Perm-Ban', `Email ${email} permanently banned from special status after 3 failures.`, 'danger');
          return res.status(403).json({ error: 'INVALID PARTY ENCRYPTION KEY. MAXIMUM ATTEMPTS EXCEEDED. YOU ARE NOW BANNED FROM SPECIAL STATUS.' });
        }
        
        await addAuditEntry('Access Violation', `User ${email} attempted restricted role with invalid key (Attempt ${attempts}/3).`, 'warning');
        return res.status(403).json({ error: `INVALID PARTY ENCRYPTION KEY. ${3 - attempts} attempts remaining before permanent ban.` });
      }
    }

    const birthYear = dob.split('-')[0];
    const firstName = fullName.split(' ')[0].toLowerCase().trim();
    // Generate unique ID instantly using random suffix to avoid slow sequential DB loops
    const userId = `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;
    const password = `${firstName}123${birthYear}`;

    const newUser = await UserModel.create({
      id: userId, name: fullName, birthYear, email, phone, address, verificationId,
      password, hasVoted: false, failedAttempts: 0, isBanned: false, role: role || 'user',
      photo: photo || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
      candidateAuthAttempts: registrationAttempts.get(email) || 0, 
      isCandidateBanned: bannedCandidateEmails.has(email), 
      partyId,
      region: region || regions[Math.floor(Math.random() * regions.length)],
      delegatePower: role === 'delegate' ? 10 : 1 // Delegates have 10x voting weight
    });

    if (role === 'candidate') {
      await CandidateModel.create({
        id: userId, name: fullName, party: parties[partyId]?.name || 'Independent',
        partyId: partyId,
        symbol: symbol || parties[partyId]?.symbol || '#',
        bio: `Decentralized candidate for the ${parties[partyId]?.name || 'Independent'} party.`,
        platform: ['Digital governance', 'Node transparency', 'Privacy first'],
        photo: newUser.photo || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
        region: newUser.region
      });
    }

    await addAuditEntry('User Registered', `New ${role} ${userId} registered in ${newUser.region}.`, 'info');
    res.json({ userId, password });
  });

  app.get('/api/candidates', async (req, res) => {
    const candidates = await CandidateModel.find();
    res.json(candidates);
  });

  app.post('/api/vote', async (req, res) => {
    const isVotingOpen = await getSetting('isVotingOpen', true);
    if (!isVotingOpen) return res.status(403).json({ error: 'NETWORK OFFLINE: The EVoting Election Portal is currently closed.' });
    const { userId, candidateId } = req.body;
    const user = await UserModel.findOne({ id: userId });
    if (!user || user.hasVoted) return res.status(400).json({ error: 'PROTOCOL REJECTION: Invalid identity or vote already recorded Website.' });
    user.hasVoted = true;
    await user.save();
    await addVoteToChain(userId, candidateId, user.region, (user.delegatePower || 1) * VOTE_MULTIPLIER);
    res.json({ success: true });
  });

  app.get('/api/notifications', async (req, res) => {
    const notifications = await NotificationModel.find().sort({ timestamp: -1 });
    res.json(notifications);
  });
  
  app.get('/api/admin/stats', async (req, res) => {
    // Return cached stats if available to handle 1000+ concurrent admin views
    if (statsCache) return res.json(statsCache);
    const eligibleVoters = await getSetting('eligibleVoters', 6000000);

    // Optimized: Use MongoDB aggregation for regional turnout to prevent memory bottlenecks
    const turnoutData = await BlockModel.aggregate([
      { $match: { index: { $gt: 0 } } },
      { $group: { _id: "$vote.region", count: { $sum: "$vote.weight" } } }
    ]);

    const regionalTurnout = regions.map(r => {
      const match = turnoutData.find(d => d._id === r);
      return { name: r, votes: match ? match.count : 0 };
    });
    
    // Get total weighted votes for trend visualization
    const weightTotal = await BlockModel.aggregate([{ $match: { index: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: "$vote.weight" } } }]);
    const totalWeightedVotes = weightTotal[0]?.total || 0;

    const turnoutTrend = [
      { time: '08:00', count: VOTE_MULTIPLIER * 0.3 },
      { time: '12:00', count: totalWeightedVotes * 0.4 },
      { time: '14:00', count: totalWeightedVotes * 0.7 },
      { time: '17:00', count: totalWeightedVotes },
    ];

    statsCache = { 
      regionalTurnout, 
      turnoutTrend, 
      eligibleVoters, 
      totalWeightedVotes,
      remainingVotes: Math.max(0, eligibleVoters - totalWeightedVotes)
    };
    res.json(statsCache);
  });

  app.post('/api/admin/broadcast', async (req, res) => {
    const { title, message, type } = req.body;
    const notification = await NotificationModel.create({
      id: crypto.randomBytes(4).toString('hex'),
      timestamp: new Date().toISOString(),
      title,
      message,
      type: type || 'info'
    });
    
    await addAuditEntry('System Broadcast', `Global alert: ${title}`, 'info');
    
    // Notify all connected clients
    broadcastToAll('notification', notification);
    
    res.json(notification);
  });

  app.get('/api/results', async (req, res) => {
     // Ensure voterId and role are strings to satisfy TypeScript and Mongoose
     const voterId = String(req.query.voterId || '');
     const role = String(req.query.role || '');
     const view = String(req.query.view || '');
     
     const isResultsPublished = await getSetting('isResultsPublished', false);
     const eligibleVoters = await getSetting('eligibleVoters', 6000000);
     // Use cached results for standard users to prevent DB thrashing
     if (resultsCache && role !== 'admin' && isResultsPublished) return res.json(resultsCache);

     // Find user if voterId exists
     const user = voterId ? await UserModel.findOne({ id: voterId }) : null;
     const candidates = await CandidateModel.find().lean();
     
     // Optimized: Aggregate vote weights directly in DB
     const voteAggregation = await BlockModel.aggregate([
       { $match: { index: { $gt: 0 } } },
       { $group: { _id: "$vote.candidateId", totalWeight: { $sum: "$vote.weight" } } }
     ]);
     
     const voteMap = Object.fromEntries(voteAggregation.map(v => [v._id, v.totalWeight]));
     const totalVotes = voteAggregation.reduce((acc, curr) => acc + curr.totalWeight, 0);
     
     const isVotingOpen = await getSetting('isVotingOpen', true);

     // Privacy Guard: Avoid fetching full blockchain unless results are published or user is admin
     const blockchain = (role === 'admin' && view === 'explorer') 
        ? await BlockModel.find({ index: { $gt: 0 } }).sort({ index: -1 }).limit(50) 
        : [];

     if (!isResultsPublished) {
        return res.json({ 
          results: candidates.map(c => ({ ...c, votes: 0 })), 
          totalVotes, 
          eligibleVoters,
          isVotingOpen, 
          isResultsPublished,
          myVoteStatus: user?.hasVoted ? "Protocol Verification Confirmed" : null,
          blockchain
        });
     }

     const resultsList = candidates.map(c => ({
       ...c,
       votes: voteMap[c.id] || 0
     })).sort((a, b) => b.votes - a.votes);

     const totalWeight = resultsList.reduce((sum, c) => sum + c.votes, 0);

     const response = { 
       results: resultsList, 
       totalVotes: totalWeight, 
       eligibleVoters,
       isVotingOpen, 
       isResultsPublished,
       blockchain
     };
     if (isResultsPublished) resultsCache = response;
     res.json(response);
  });

  app.post('/api/admin/publish-results', async (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ error: 'AUTHORIZATION FAILURE: CREDENTIAL MISMATCH' });
    }
    await setSetting('isResultsPublished', true);
    await addAuditEntry('Results Published', 'Election outcome has been released to the Website after the voting complete', 'danger');
    broadcastResultsUpdate();
    res.json({ success: true, isResultsPublished: true });
  });

  app.post('/api/admin/unpublish-results', async (req, res) => {
    await setSetting('isResultsPublished', false);
    await addAuditEntry('Results Retracted', 'Election outcome has been withdrawn from public view.', 'warning');
    broadcastResultsUpdate();
    res.json({ success: true, isResultsPublished: false });
  });

  app.post('/api/admin/toggle-voting', async (req, res) => {
    const current = await getSetting('isVotingOpen', true);
    const next = !current;
    await setSetting('isVotingOpen', next);
    await addAuditEntry('System Update', `Voting ${next ? 'OPENED' : 'CLOSED'} by Administrator.`, next ? 'info' : 'danger');
    broadcastResultsUpdate();
    res.json({ isVotingOpen: next });
  });

  app.get('/api/admin/audit-log', async (req, res) => {
    const logs = await AuditEntryModel.find().sort({ _id: -1 }).limit(100);
    res.json(logs);
  });

  // User Profile
  app.get('/api/users/:id', async (req, res) => {
    const user = await UserModel.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const u: any = user.toObject();
    delete u.password;
    delete u.verificationId;
    res.json(u);
  });

  app.put('/api/users/:id', async (req, res) => {
    const user = await UserModel.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { name, email, phone, address, photo } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (photo) user.photo = photo;

    await user.save();
    await addAuditEntry('Profile Updated', `User ${user.id} updated their profile info.`, 'info');
    const u: any = user.toObject();
    delete u.password;
    delete u.verificationId;
    res.json(u);
  });

  app.put('/api/admin/candidates/:id', async (req, res) => {
    const { name, party, bio, platform, photo, symbol } = req.body;
    const candidate = await CandidateModel.findOne({ id: req.params.id });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    if (name) candidate.name = name;
    if (party) candidate.party = party;
    if (bio) candidate.bio = bio;
    if (platform) candidate.platform = platform;
    if (photo) candidate.photo = photo;
    if (symbol) candidate.symbol = symbol;

    await candidate.save();
    await addAuditEntry('Candidate Updated', `Candidate ${req.params.id} details updated by Admin.`, 'warning');
    res.json(candidate);
  });

  app.post('/api/feedback', async (req, res) => {
    const { name, email, subject, message } = req.body;
    const feedback = await FeedbackModel.create({
      name, email, subject, message,
      timestamp: new Date().toISOString()
    });
    
    addAuditEntry('Feedback Received', `From ${email}: ${subject}`, 'info');
    
    res.json({ success: true, feedback });
  });

  app.post('/api/admin/reset-election', async (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ error: 'AUTHORIZATION FAILURE: CREDENTIAL MISMATCH' });
    }

    try {
      // 1. Delete all blocks except genesis
      await BlockModel.deleteMany({ index: { $gt: 0 } });
      
      // 2. Reset all users to hasVoted: false
      await UserModel.updateMany({}, { hasVoted: false });
      
      // 3. Reset election state settings
      await setSetting('isVotingOpen', true);
      await setSetting('isResultsPublished', false);
      
      // 4. Clear audit logs
      await AuditEntryModel.deleteMany({});
      
      await addAuditEntry('SYSTEM_PURGE', 'The election database has been reset to initial state. All users restored to unvoted status.', 'danger');
      
      // Notify all results clients to fetch fresh (empty) data
      broadcastResultsUpdate();
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset system.' });
    }
  });

  // Seed Database on startup
  await seedDatabase();

  // Unified Event Stream - One connection per tab
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    streamClients.push(res);
    req.on('close', () => {
      streamClients = streamClients.filter(c => c !== res);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Secure Server on port ${PORT}`));
}
startServer();
