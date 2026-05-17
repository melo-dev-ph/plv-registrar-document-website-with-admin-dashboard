require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

class RegistrarServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        // 1. Initialize Database
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        // 2. Initialize Email Transporter
        this.emailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SYSTEM_EMAIL,
                pass: process.env.APP_PASSWORD
            }
        });

        // 3. Boot up the server
        this.initMiddleware();
        this.initRoutes();
    }

    /**
     * Set up Express middleware
     */
    initMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    /**
     * Define API endpoints
     */
    initRoutes() {
        // Arrow function binds 'this' context to the class
        this.app.post('/api/update-status', (req, res) => this.handleStatusUpdate(req, res));
    }

    /**
     * Master controller for the /api/update-status endpoint
     */
    async handleStatusUpdate(req, res) {
        const { ticket_number, status, admin_notes, working_days } = req.body;

        try {
            // Step A: Get the student data
            const requestData = await this.fetchRequestData(ticket_number);

            // Step B: Update Supabase
            await this.updateDatabaseStatus(ticket_number, status);

            // Step C: Send the Email
            await this.sendNotificationEmail(requestData, status, admin_notes, working_days);

            res.status(200).json({ status: 'success', message: 'Status updated and email sent successfully!' });

        } catch (error) {
            console.error('Server Error:', error.message || error);
            res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Internal Server Error' });
        }
    }

    /**
     * Helper: Fetches request and student details from Supabase
     */
    async fetchRequestData(ticketNumber) {
        const { data, error } = await this.supabase
            .from('requests')
            .select('*, students(full_name)')
            .eq('ticket_no', ticketNumber)
            .single();

        if (error || !data) {
            throw { statusCode: 404, message: 'Ticket not found in the database.' };
        }
        
        return data;
    }

    /**
     * Helper: Updates the document status in Supabase
     */
    async updateDatabaseStatus(ticketNumber, newStatus) {
        const { error } = await this.supabase
            .from('requests')
            .update({ status: newStatus })
            .eq('ticket_no', ticketNumber);

        if (error) {
            throw { statusCode: 500, message: 'Failed to update database status.' };
        }
    }

    /**
     * Helper: Formats and sends the HTML email via Nodemailer
     */
    async sendNotificationEmail(requestData, status, adminNotes, workingDays) {
        const studentEmail = requestData.student_email;
        const studentName = requestData.students.full_name;
        
        // Parse the JSONB array into a readable string
        const documentsList = requestData.documents.join(', ');

        const emailSubject = `PLV Registrar: Update on Request ${requestData.ticket_no}`;
        let emailBody = `<p>Dear ${studentName},</p>`;

        if (status === 'In Process') {
            emailBody += `
                <p>Your request for <strong>${documentsList}</strong> is now being processed.</p>
                <p>Please expect it to be ready within <strong>${workingDays || 3} working days</strong>.</p>
                <p><strong>Registrar Notes:</strong> ${adminNotes || 'No additional notes.'}</p>
            `;
        } else if (status === 'Completed') {
            emailBody += `
                <p>Great news! Your requested documents (<strong>${documentsList}</strong>) are now ready for pickup at the PLV Registrar Office.</p>
                <p><strong>Registrar Notes:</strong> ${adminNotes || 'Please bring your student ID.'}</p>
            `;
        }

        emailBody += `<br><p>Best regards,<br>Pamantasan ng Lungsod ng Valenzuela Registrar</p>`;

        // Send the actual email
        await this.emailTransporter.sendMail({
            from: process.env.SYSTEM_EMAIL,
            to: studentEmail,
            subject: emailSubject,
            html: emailBody
        });
    }

    /**
     * Start listening for requests
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`[🚀] PLV Registrar Server running in OOP Mode on http://localhost:${this.port}`);
        });
    }
}

// Instantiate and start the server
const server = new RegistrarServer();
server.start();