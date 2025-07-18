require('dotenv').config()

const express = require('express')
const multer = require('multer')
const cors = require('cors')
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
const morgan = require('morgan')
const { body, validationResult } = require('express-validator')
const xss = require('xss-filters')

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined'))

// Basic middleware
app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many submission attempts. Please try again in 15 minutes.'
  }
})

// File upload validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'), false)
  }
}

const upload = multer({
  dest: 'uploads/',
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 5
  },
  fileFilter: fileFilter
})

// ZSB Branch email mapping
const BRANCH_EMAILS = {
  'Rajya Sainik Board': 'paulamit001@gmail.com',
  'ZSB Burdwan': 'nayanipaul001@gmail.com',
  'ZSB Coochbehar': 'nayanipaul.24@gmail.com',
  'ZSB Dakshin Dinajpur': 'nayanipaul001@gmail.com',
  'ZSB Darjeeling': 'nayanipaul.24@gmail.com',
  'ZSB Howrah': 'nayanipaul001@gmail.com',
  'ZSB Jalpaiguri': 'nayanipaul.24@gmail.com',
  'ZSB Kalimpong': 'nayanipaul001@gmail.com',
  'ZSB Kolkata': 'nayanipaul.24@gmail.com',
  'ZSB Malda': 'nayanipaul001@gmail.com',
  'ZSB Midnapore': 'nayanipaul.24@gmail.com',
  'ZSB Murshidabad': 'nayanipaul001@gmail.com',
  'ZSB Nadia': 'nayanipaul.24@gmail.com',
  'ZSB North 24 Parganas': 'nayanipaul001@gmail.com',
  'ZSB South 24 Parganas': 'nayanipaul.24@gmail.com'
}

// Prevent rapid re-submission
const recent = new Map()
function isDuplicate(key) {
  const now = Date.now()
  const last = recent.get(key)
  if (last && now - last < 5000) return true
  recent.set(key, now)
  return false
}

function getBranchKey(branchValue) {
  return branchValue.split(' (')[0].trim()
}

// Optimized email template
function generateOptimizedEmailTemplate(data, forUser = false) {
  const logoURL = 'https://feedback-form-b24b.onrender.com/logo.jpg'
  
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>WB Sainik Board</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)"><div style="background:linear-gradient(to bottom,#e03c3c,#3030ac,#27aadd);padding:20px;text-align:center"><img src="${logoURL}" alt="Logo" style="max-height:80px;margin-bottom:10px"><h1 style="color:#fff;margin:0;font-size:20px">West Bengal Sainik Board</h1><p style="color:#e8f4f8;margin:5px 0;font-size:14px">${forUser ? 'Thank you for your submission' : 'New Submission Received'}</p></div><div style="padding:20px"><h2 style="color:#3030ac;margin:0 0 15px;font-size:18px">Submission Details</h2><table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #dee2e6"><tr style="background:#f8f9fa"><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;width:30%">Rank</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.rank}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;background:#f8f9fa">Name</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.name}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;background:#f8f9fa">Relationship</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.relationship}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;background:#f8f9fa">Branch</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.branch}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;background:#f8f9fa">Phone</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.phone}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;background:#f8f9fa">Email</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.email || '-'}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;background:#f8f9fa">ID</td><td style="padding:10px;border-bottom:1px solid #dee2e6">${data.id || '-'}</td></tr><tr><td style="padding:10px;font-weight:bold;background:#f8f9fa;vertical-align:top">Feedback</td><td style="padding:10px">${data.sugg || '-'}</td></tr></table><div style="background:#e9ecef;padding:15px;border-radius:5px;margin-bottom:20px"><p style="margin:0;font-size:14px;color:#6c757d"><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>${data.attachmentCount > 0 ? `<p style="margin:10px 0 0;font-size:14px;color:#6c757d"><strong>Files:</strong> ${data.attachmentCount}</p>` : ''}</div></div>${forUser ? '<div style="background:#363c42;color:#fff;padding:20px;text-align:center"><p style="margin:0;font-size:14px">Automated notification from WB Sainik Board</p><p style="margin:10px 0 0;font-size:12px;color:#adb5bd">Do not reply. Contact your ZSB branch for support.</p><hr style="border:none;border-top:1px solid #495057;margin:15px 0"><p style="margin:0;font-size:12px;color:#6c757d">Government of West Bengal | Serving Our Veterans and Families with Pride</p></div>' : ''}</div></body></html>`
}

// Input validation
const validateSubmission = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('phone')
  .trim()
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Phone number must be a valid 10-digit Indian mobile number starting with 6-9'),
  body('email').optional().isEmail().normalizeEmail(),
  body('rank').trim().isLength({ min: 2, max: 50 }).escape(),
  body('branch').trim().isIn(Object.keys(BRANCH_EMAILS)),
  body('relationship').trim().isLength({ min: 2, max: 50 }).escape(),
  body('sugg').optional().trim().isLength({ max: 2000 }).customSanitizer(value => xss.inHTMLData(value))
]

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// Email sending function
async function sendMail(data, files = []) {
  if (!process.env.NOTIFY_EMAIL || !process.env.APP_PASSWORD) {
    throw new Error('Email environment variables not set')
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
      user: process.env.NOTIFY_EMAIL, 
      pass: process.env.APP_PASSWORD 
    }
  })

  await transporter.verify()

  data.attachmentCount = files.length
  const emailHTML = generateOptimizedEmailTemplate(data, false)
  const subject = `New Feedback/Grievance: ${data.rank} ${data.name} - ${getBranchKey(data.branch)}`

  const attachments = files.map(file => ({
    filename: file.originalname,
    path: file.path,
    contentType: file.mimetype
  }))

  const branchKey = getBranchKey(data.branch)
  const branchEmail = BRANCH_EMAILS[branchKey]
  const recipients = [process.env.NOTIFY_EMAIL]
  
  if (branchEmail) {
    recipients.push(branchEmail)
  }

  await transporter.sendMail({
    from: `"WB Sainik Board System" <${process.env.NOTIFY_EMAIL}>`,
    to: recipients,
    subject: subject,
    html: emailHTML,
    attachments: attachments
  })

  if (data.email && data.email.includes('@')) {
    const userHTML = generateOptimizedEmailTemplate(data, true)
    await transporter.sendMail({
      from: `"WB Sainik Board" <${process.env.NOTIFY_EMAIL}>`,
      to: data.email,
      subject: 'Thank you for your submission - West Bengal Sainik Board',
      html: userHTML,
      attachments: attachments
    })
  }
}

// Main submission endpoint
app.post('/submit', 
  submitLimiter,
  validateSubmission,
  handleValidationErrors,
  upload.array('upload', 5),
  async (req, res) => {
    const data = req.body
    const files = req.files || []

    try {
      if (isDuplicate(`${data.name}_${data.phone}`)) {
        return res.status(429).json({ 
          success: false, 
          error: 'Please wait 5 seconds before resubmitting' 
        })
      }

      await sendMail(data, files)

      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
      })

      return res.json({ 
        success: true, 
        message: 'Form submitted successfully and notifications sent' 
      })

    } catch (err) {
      console.error('Submission error:', err)
      
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
      })

      return res.status(500).json({ 
        success: false, 
        error: 'Server error. Please try again later.' 
      })
    }
  }
)

// Health check
app.get('/health', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.NOTIFY_EMAIL, pass: process.env.APP_PASSWORD }
    })
    
    await transporter.verify()
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: {
        email: 'connected',
        uploads: fs.existsSync('./uploads') ? 'ready' : 'not ready'
      }
    })
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Service unavailable',
      timestamp: new Date().toISOString() 
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum 5MB per file allowed.'
      })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 files allowed.'
      })
    }
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again later.'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
