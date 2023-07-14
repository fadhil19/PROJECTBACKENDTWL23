const cors = require("cors");
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = 3500; // Ganti dengan port yang Anda inginkan
mongoose.connect('mongodb+srv://fadhilken:244341@dbtwl2023.0qufrri.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('database connected!'));
const Schema = mongoose.Schema;
const mahasiswaSchema = new Schema({
  name: String,
  nim: String,
  birthdate: String,
  address: String,
  username: String,
  password: String
});
const mahasiswaModel = mongoose.model('Mahasiswa', mahasiswaSchema);


const userSchema = new Schema({
  username: String,
  password: String
});

const User = mongoose.model('User', userSchema);

let products = ['tt','ii'];

// Menggunakan middleware bodyParser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({origin:"*"}));

// Secret key for JWT
const secretKey = 'your-secret-key';

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  });
}

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword
    });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while registering the user' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordMatch = bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const token = jwt.sign({ username: user.username }, secretKey);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while logging in' });
  }
});

app.get('/mahasiswa', authenticateToken, async (req, res) => {
  const mahasiswa = await mahasiswaModel.find();
  res.json(mahasiswa);
});

app.get('/mahasiswa/:nim', authenticateToken, async (req, res) => {
  const nim = req.params.nim;
  const mahasiswa = await mahasiswaModel.find({ nim: nim });
  if (mahasiswa) {
    res.json(mahasiswa);
  } else {
    res.status(404).json({ error: 'Mahasiswa tidak ada!' });
  }
});

app.post('/mahasiswa', authenticateToken, async (req, res) => {
  const newMahasiswa = new mahasiswaModel(req.body);
  try {
    await newMahasiswa.save();
    res.json(newMahasiswa);
  } catch (error) {
    res.json(error);
  }
});

// Update data by NIM
app.put('/mahasiswa/:nim', authenticateToken, async (req, res) => {
  const { nim } = req.params;
  const newMahasiswa = req.body;

  try {
    const updatedData = await mahasiswaModel.findOneAndUpdate({ nim: nim }, newMahasiswa, { new: true });
    res.json(updatedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the data' });
  }
});

app.delete('/mahasiswa/:nim', authenticateToken, async (req, res) => {
  const { nim } = req.params;

  try {
    await mahasiswaModel.findOneAndDelete({ nim: nim });
    res.json({ message: 'Data deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the data' });
  }
});

function generateId() {
  const timestamp = Date.now().toString(); // Mendapatkan timestamp saat ini
  const randomNum = Math.floor(Math.random() * 1000).toString(); // Mendapatkan angka acak antara 0-999
  const uniqueId = timestamp + randomNum; // Menggabungkan timestamp dan angka acak
  return uniqueId;
}

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
