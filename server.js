require('dotenv').config()
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Multer config: up to 10 files, each ≤10MB
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10
    }
})

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

// Helper to clean branch names for mapping
function getBranchKey(branchValue) {
    return branchValue.split(' (')[0].trim()
}

// Enhanced email template with logo and professional styling
function generateEmailTemplate(data, forUser = false) {
    const logoURL = 'https://feedback-form-b24b.onrender.com/logo.jpg'
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>West Bengal Sainik Board - Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; }
        .logo { width: 80px; height: 80px; margin: 0 auto 15px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; }
        .logo img { width: 60px; height: 60px; object-fit: contain; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px; }
        .form-section { margin-bottom: 25px; }
        .form-section h3 { color: #1e3c72; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px; }
        .form-row { display: flex; margin-bottom: 12px; }
        .form-label { font-weight: bold; color: #333; min-width: 150px; padding-right: 15px; }
        .form-value { color: #666; flex: 1; word-wrap: break-word; }
        .files-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px; }
        .file-item { background: white; padding: 8px 12px; margin: 5px 0; border-radius: 3px; border-left: 3px solid #1e3c72; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .warning { background-color: #fff3cd; color: #856404; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px; margin-bottom: 20px; }
        .unique-id { font-family: monospace; background: #e9ecef; padding: 5px 8px; border-radius: 3px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="${logoURL}" alt="WB Sainik Board Logo" onerror="this.style.display='none'"/>
            </div>
            <h1>West Bengal Sainik Board</h1>
            <p>${forUser ? 'Thank you for your submission' : 'New Form Submission Received'}</p>
        </div>
        
        <div class="content">
            ${forUser ? 
                '<div class="warning"><strong>Confirmation:</strong> Your form has been submitted successfully. You will receive a response from the concerned branch office soon.</div>' :
                '<div class="warning"><strong>Action Required:</strong> A new form submission has been received and requires your attention.</div>'
            }
            
            <div class="form-section">
                <h3>Personal Information</h3>
                <div class="form-row">
                    <div class="form-label">Name:</div>
                    <div class="form-value">${data.name || 'Not provided'}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Service Number:</div>
                    <div class="form-value">${data.serviceNumber || data.service_number || 'Not provided'}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Email:</div>
                    <div class="form-value">${data.email || 'Not provided'}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Phone:</div>
                    <div class="form-value">${data.phone || 'Not provided'}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Address:</div>
                    <div class="form-value">${data.address || 'Not provided'}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Branch:</div>
                    <div class="form-value">${data.branch || 'Not provided'}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Relationship:</div>
                    <div class="form-value">${data.relationship || 'Not provided'}</div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Message/Request</h3>
                <div class="form-value" style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${data.message || 'No message provided'}</div>
            </div>
            
            ${data.files && data.files.length > 0 ? `
            <div class="form-section">
                <h3>Attached Files (${data.files.length})</h3>
                <div class="files-section">
                    ${data.files.map(file => `
                        <div class="file-item">
                            <strong>${file.originalname}</strong> 
                            <span style="color: #666; font-size: 12px;">(${(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p><strong>Submission ID:</strong> <span class="unique-id">${uniqueId}</span></p>
            <p><strong>Submitted on:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <p><em>This is an automated notification from West Bengal Sainik Board.</em></p>
            <p><em>Do not reply to this mail. For further support please contact your ZSB branch.</em></p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Government of West Bengal | Serving Our Veterans and Families with Pride</strong></p>
        </div>
    </div>
</body>
</html>
    `
}

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use app password for Gmail
    }
})

// MAIN FORM SUBMISSION ROUTE - This was missing!
app.post('/submit-form', upload.array('files', 10), async (req, res) => {
    try {
        console.log('Form submission received:', req.body)
        console.log('Files received:', req.files)
        
        // Extract form data with proper field name mapping
        const formData = {
            name: req.body.name,
            serviceNumber: req.body.serviceNumber || req.body.service_number, // Handle both possible field names
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            branch: req.body.branch,
            relationship: req.body.relationship,
            message: req.body.message,
            files: req.files || []
        }
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.branch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name, email, and branch are required' 
            })
        }
        
        // Check for duplicate submission
        const submissionKey = `${formData.email}-${formData.name}-${Date.now()}`
        if (isDuplicate(submissionKey)) {
            return res.status(429).json({ 
                success: false, 
                message: 'Please wait before submitting again' 
            })
        }
        
        // Get branch email
        const branchKey = getBranchKey(formData.branch)
        const branchEmail = BRANCH_EMAILS[branchKey]
        
        if (!branchEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid branch selected' 
            })
        }
        
        // Create email subject with service number
        const serviceNumberText = formData.serviceNumber ? ` - Service No: ${formData.serviceNumber}` : ''
        const emailSubject = `New Form Submission from ${formData.name}${serviceNumberText}`
        
        // Generate email content
        const branchEmailContent = generateEmailTemplate(formData, false)
        const userEmailContent = generateEmailTemplate(formData, true)
        
        // Prepare attachments
        const attachments = formData.files.map(file => ({
            filename: file.originalname,
            path: file.path,
            contentType: file.mimetype
        }))
        
        // Send email to branch
        const branchMailOptions = {
            from: process.env.EMAIL_USER,
            to: branchEmail,
            subject: emailSubject,
            html: branchEmailContent,
            attachments: attachments
        }
        
        // Send email to user (confirmation)
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: formData.email,
            subject: 'Form Submission Confirmation - West Bengal Sainik Board',
            html: userEmailContent
        }
        
        // Send both emails
        await Promise.all([
            transporter.sendMail(branchMailOptions),
            transporter.sendMail(userMailOptions)
        ])
        
        // Clean up uploaded files after email is sent
        formData.files.forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting file:', err)
            })
        })
        
        console.log('Form submitted successfully for:', formData.name)
        
        res.json({ 
            success: true, 
            message: 'Form submitted successfully! You will receive a confirmation email shortly.' 
        })
        
    } catch (error) {
        console.error('Form submission error:', error)
        
        // Clean up uploaded files on error
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err)
                })
            })
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred. Please try again later.' 
        })
    }
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
