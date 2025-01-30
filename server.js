const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Bağlantısı Başarılı'))
    .catch((err) => console.error('MongoDB Bağlantı Hatası:', err));

// Orta Katmanlar
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// EJS Ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Skor Şeması ve Modeli
const ScoreSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userID: { type: String, required: false },
    score: { type: Number, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Score = mongoose.model('KelimeScore', ScoreSchema);

// Ana Sayfa
app.get('/', (req, res) => {
    res.render('index');
});

// Kelimatik Sayfası
app.get('/kelimatik', (req, res) => {
    res.render('kelimatik');
});

app.get('/moderator', (req, res) => {
    res.render('moderator');
});

// Skorları Listele
app.get('/scores', async (req, res) => {
    try {
        const scores = await Score.find().sort({ score: -1 }).limit(5);
        res.json(scores);
    } catch (err) {
        res.status(500).json({ message: "Skorlar alınamadı.", error: err });
    }
});

// Yeni Skor Kaydet ve Fazla Skorları Sil
app.post('/save-score', async (req, res) => {
    const { username, userID, score, duration } = req.body;

    try {
        // Yeni skoru kaydet
        const newScore = new Score({ username, userID, score, duration });
        await newScore.save();

        // En yüksek 5 skor dışındaki skorları sil
        const scoresToDelete = await Score.find().sort({ score: -1 }).skip(5);
        for (const scoreToDelete of scoresToDelete) {
            await Score.findByIdAndDelete(scoreToDelete._id);
        }

        res.status(201).json({ message: 'Yeni skor kaydedildi ve fazlalık skorlar silindi!' });
    } catch (err) {
        console.error('Skor kaydetme hatası:', err);
        res.status(500).json({ message: 'Veritabanına kayıt sırasında bir hata oluştu.' });
    }
});

// Sunucuyu Dinleme
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
