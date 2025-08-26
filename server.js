require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();


const corsOptions = {
  origin: 'http://localhost:5173', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});


app.post('/api/send-email', async (req, res) => {
  const { firstName, lastName, email, phone, address, message } = req.body;
  

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
  }

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
        </ul>
        <hr>
        <p>À très bientôt,</p>
        <p><strong>L'équipe Respire Propre</strong></p>
        <p><a href="http://localhost:5173">Visitez notre site</a></p> 
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