require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Configuration CORS
const allowedOrigins = [
  'http://localhost:5173',              // Développement local (Vite)
  'https://saison-plus.vercel.app',     // Ton frontend en production (Vercel)
  'https://respire-back.onrender.com'   // Ton backend Render
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: '✅ API Respire Propre - Backend opérationnel' });
});

// Formatage date
const formatDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Route email
app.post('/api/send-email', async (req, res) => {
  const { firstName, lastName, email, phone, address, message, reservationDate, reservationTime } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
  }

  // Transporteur Nodemailer avec Gmail (mot de passe d’application requis)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Ton email Gmail
      pass: process.env.EMAIL_PASS, // Mot de passe d’application Gmail
    },
  });

  // Email vers l’entreprise
  const mailToCompany = {
    from: `"Formulaire Respire Propre" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `Nouvelle demande de devis de ${firstName} ${lastName}`,
    replyTo: email,
    html: `
      <h1>Nouvelle demande depuis le site Respire Propre</h1>
      <h2>Détails du contact :</h2>
      <ul>
        <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
        <li><strong>Email :</strong> ${email}</li>
        <li><strong>Téléphone :</strong> ${phone || 'Non fourni'}</li>
        <li><strong>Adresse :</strong> ${address || 'Non fournie'}</li>
      </ul>
      ${reservationDate && reservationTime ? `
      <h2>Détails de la réservation :</h2>
      <ul>
        <li><strong>Date :</strong> ${formatDate(reservationDate)}</li>
        <li><strong>Heure :</strong> ${reservationTime}</li>
      </ul>` : ''}
      <h2>Message :</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  // Email de confirmation vers l’utilisateur
  const mailToUser = {
    from: `"Saison +" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Confirmation de votre demande',
    html: `
      <h2>Bonjour ${firstName},</h2>
      <p>Nous avons bien reçu votre demande et nous vous contacterons rapidement.</p>
      <h3>Récapitulatif :</h3>
      <ul>
        <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
        <li><strong>Email :</strong> ${email}</li>
        <li><strong>Téléphone :</strong> ${phone || 'Non fourni'}</li>
        <li><strong>Adresse :</strong> ${address || 'Non fournie'}</li>
        ${reservationDate && reservationTime ? `
        <li><strong>Date souhaitée :</strong> ${formatDate(reservationDate)}</li>
        <li><strong>Heure souhaitée :</strong> ${reservationTime}</li>
        ` : ''}
      </ul>
      <p><strong>Votre message :</strong><br>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Merci de votre confiance,<br>L’équipe Respire Propre</p>
      <p><a href="https://saison-plus.vercel.app">Visitez notre site</a></p>
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(mailToCompany),
      transporter.sendMail(mailToUser),
    ]);
    res.status(200).json({ message: '✅ Message envoyé avec succès !' });
  } catch (error) {
    console.error('Erreur lors de l’envoi :', error);
    res.status(500).json({ message: '❌ Erreur lors de l’envoi de l’email. Réessayez plus tard.' });
  }
});

// Démarrage (Render impose process.env.PORT)
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend lancé sur le port ${PORT}`);
});
