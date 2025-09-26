require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Configuration CORS pour autoriser plusieurs origines (local et prod)
const corsOptions = {
  origin: (origin, callback) => {
    // Liste des origines autorisées
    const allowedOrigins = [
      'http://localhost:5173',  // Développement local (Vite)
      'https://saison-plus.vercel.app/'  // Production (Vercel) - remplace par ton domaine exact si différent
    ];
    // Autorise les requêtes sans origine (ex. Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,  // Pour les anciens navigateurs
  credentials: true  // Si tu utilises des cookies/auth (optionnel ici)
};
app.use(cors(corsOptions));
app.use(express.json());

// Route pour la racine (pour éviter 404 si appelée par erreur)
app.get('/', (req, res) => {
  res.json({ message: 'API Respire Propre - Backend opérationnel' });
});

const formatDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Ton endpoint existant (inchangé)
app.post('/api/send-email', async (req, res) => {
  const { firstName, lastName, email, phone, address, message, reservationDate, reservationTime  } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailToCompany = {
    from: `"Formulaire Respire Propre" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `Nouvelle demande de devis de ${firstName} ${lastName}`,
    replyTo: email,
    html: `
      <h1>Nouvelle demande depuis le site Respire Propre</h1>
      <p>Vous avez reçu un nouveau message de la part d'un visiteur.</p>
      <hr>
      <h2>Détails du contact :</h2>
      <ul>
        <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
        <li><strong>Email :</strong> <a href="mailto:${email}">${email}</a> (cliquez sur "Répondre" pour lui écrire)</li>
        <li><strong>Téléphone :</strong> ${phone || 'Non fourni'}</li>
        <li><strong>Adresse :</strong> ${address || 'Non fournie'}</li>
      </ul>
       ${reservationDate && reservationTime ? `
      <hr>
      <h2>Détails de la réservation souhaitée :</h2>
      <ul>
        <li><strong>Date :</strong> ${formatDate(reservationDate)}</li>
        <li><strong>Heure :</strong> ${reservationTime}</li>
      </ul>` : ''}
      <hr>
      <h2>Message :</h2>
      <p style="white-space: pre-wrap;">${message}</p>
    `,
  };

  const mailToUser = {
    from: `"Respire Propre" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Nous avons bien reçu votre message !',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Merci de nous avoir contactés, ${firstName} !</h2>
        <p>Nous avons bien reçu votre demande et nous vous remercions de l'intérêt que vous portez à <strong>Respire Propre</strong>.</p>
        <p>Notre équipe va étudier votre message avec attention et reviendra vers vous dans les plus brefs délais pour discuter de vos besoins en nettoyage de canapé, tapis ou matelas.</p>
        <hr>
        <p><strong>Récapitulatif de votre demande :</strong></p>
        <ul>
          <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>Téléphone :</strong> ${phone || 'Non fourni'}</li>
          <li><strong>Adresse :</strong> ${address || 'Non fournie'}</li>
          <li><strong>Message :</strong><br>${message.replace(/\n/g, '<br>')}</li>
          ${reservationDate && reservationTime ? `
            <li><strong>Date souhaitée :</strong> ${formatDate(reservationDate)}</li>
            <li><strong>Heure souhaitée :</strong> ${reservationTime}</li>
            ` : ''}
  
            <li><strong>Message :</strong><br>${message.replace(/\n/g, '<br>')}</li>
        </ul>
        <hr>
        <p>À très bientôt,</p>
        <p><strong>L'équipe Respire Propre</strong></p>
        <p><a href="https://respirepropre-one.vercel.app">Visitez notre site</a></p>  <!-- Mise à jour pour prod -->
      </div>
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(mailToCompany),
      transporter.sendMail(mailToUser)
    ]);
    res.status(200).json({ message: 'Votre message a bien été envoyé ! Vous allez recevoir une confirmation par e-mail.' });
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails:", error);
    res.status(500).json({ message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
