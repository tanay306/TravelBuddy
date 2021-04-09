const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const app = express();
const connectDB = require('./config/db.js');
const ejs = require("ejs");
const jwt = require('jsonwebtoken');
const multer = require('multer');
let path = require( 'path' );

const cors = require('cors');
app.use(express.json());
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'uploads')))

dotenv.config();

connectDB();

app.use(express.urlencoded());
app.use(cors({ credentials: true }));
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const User = require('./models/user.js');
const City = require('./models/city.js');
const generateToken = require('./utils/generateToken.js');
const { loggedin } = require('./utils/verifyUser.js');
let x = 0;
let DIR = './uploads/';
const { uuid } = require('uuidv4');
  
const storage = multer.diskStorage({
    destination: './uploads/',
filename: function (req, file, cb) {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName);
  },
});
//multer middleware
let upload = multer({
storage: storage,
fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
},
});
function checkFileType(file, cb) {
const filetypes = /pdf|xml|jpeg|jpg/;
const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
const mimetype = filetypes.test(file.mimetype);
if (mimetype && extname) {
    return cb(null, true);
} else {
    cb('Error: Files Only!');
}
}

app.get('/', async (req, res) => {
    const city = await City.find({});
    let y = '';
    city.forEach((elem) => {
        y += elem.name + ' ----- ';
    });
    let z = ' ---- ' + y + y + y + y;
    res.render('index', {mark:z});
});

app.post('/', async (req, res) => {
    try {
        const {city} = req.body;
        console.log(city);
        const foundCity = await City.find({name: city});
        if(foundCity[0]) {
            res.redirect('/getCity/' + foundCity[0].name);
        } else {
            res.render('error', {msg: "Some Error Has Occured"});
            throw new Error('City Not Found');
        }
    } catch (err) {
        res.render('error', {msg: "Some Error Has Occured"});
        console.log(err);
        throw err;
    }        
});

app.get('/signIn', async (req, res) => {
    res.render('signIn');
})

app.post('/signIn', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({ email: email });
        if (user && (await user.matchPassword(password))) {
            console.log('Successfully logged in');
            const token=jwt.sign({email: email},'tanay',{
                expiresIn:'1h'
            });
            console.log(user.role);
            if(user.role == 'User') {
                x = 1;
                res.redirect('/home');
            } else if (user.role == 'Admin') {
                x = 2;
                res.redirect('/Admin');
            }          
        } else {
            res.render('error', {msg: 'Invalid email or password'});
            throw new Error('Invalid email or password');
        }
      } catch (err) {
        res.render('error', {msg: "Some Error Has Occured"});
        console.log(err);
        throw err;
      }
});

app.get('/signUp', async (req, res) => {
    res.render('signUp');
})

app.post('/signUp', async (req, res) => {
    try {
        const {name, email, password} = req.body;
        const userExists = await User.findOne({ email: email });
        if (userExists) {
            res.render('error', {msg: "User already exists"});
          throw new Error('User already exists');
        }
        const user = await User.create({
          name: name,
          email: email,
          password: password,
        });
        if (user) {
            x = 1;
            res.redirect('/home');
        } else {
            res.render('error', {msg: "Invalid User data entered"});
          throw new Error('Invalid user data');
        }
      } catch (err) {
        res.render('error', {msg: "Some Error Has Occured"});
        console.log(err);
        throw err;
      }
});

app.get('/signOut', async (req, res) => {
    x = 0;
    res.redirect('/');
});

app.get('/home', async (req, res) => {
    const city = await City.find({});
    let y = '';
    city.forEach((elem) => {
        y += elem.name + ' ----- ';
    });
    let z = ' ---- ' + y + y + y + y;
    res.render('home', {mark:z});
});

app.post('/home', async (req, res) => {
    try {
        const {city} = req.body;
        console.log(city);
        const foundCity = await City.find({name: city});
        if(foundCity) {
            res.redirect('/getCity/' + foundCity[0].name);
        } else {
            res.render('error', {msg: "Some Error Has Occured"});
            throw new Error('Error');
        }
    } catch (err) {
        res.render('error', {msg: "Some Error Has Occured"});
        console.log(err);
        throw err;
    }    
});

app.get('/Admin', async (req, res) => {
    const city = await City.find({});
    let y = '';
    city.forEach((elem) => {
        y += elem.name + ' ----- ';
    });
    let z = ' ---- ' + y + y + y + y;
    if(x==2) {
        res.render('adminHome', {mark:z});
    } else {
        res.redirect('/');
    }
});

app.post('/Admin', async (req, res) => {
    try {
        const {city} = req.body;
        console.log(city);
        const foundCity = await City.find({name: city});
        if(foundCity) {
            // console.log("Found");
            res.redirect('/getCity/' + foundCity[0].name);
        } else {
            res.render('error', {msg: "Some Error Has Occured"});
            throw new Error('Error');
        }
    } catch (err) {
        res.render('error', {msg: "Some Error Has Occured"});
        console.log(err);
        throw err;
    }    
});

app.post('/createCity', upload.fields([{
    name: 'doc', maxCount: 1
}, {name: 'img', maxCount: 1}]),  async (req, res) => {
    try {
        const {name, information, country, days} = req.body;
        let itenary = `/${req.files.doc[0].path}`;
        let image = `/${req.files.img[0].path}`
        itenary = itenary.substring(9);
        image = image.substring(9);
        const city = await City.create({
            name: name,
            information: information,
            country: country,
            days: days,
            itenary: itenary,
            image: image,
        });
        if(city) {
            console.log(city);
            res.redirect('/Admin');
            console.log('City created');
        } else {
            res.render('error', {msg: "Invalid city data"});
            throw new Error('Invalid city data');
        }
    } catch (err) {
        res.render('error', {msg: "Some Error Has Occured"});
        console.log(err);
        throw err;
    }
});

app.get('/createCity', async (req, res) => {
    res.render('createCity');
});

let dCity;

app.get('/getCity/:city', async (req, res) => {
    try {
        let name = req.params.city;
        dCity = name;
        const city =  await City.find({name: name});
        if(city[0]) {
            let url;
            if(x==2) {url='/Admin'} else if (x==1) {url='/home'} else {url='/'};
            res.render('city', {name: city[0].name, information: city[0].information, country: city[0].country, auth:url, x:x, file: `/${city[0].image}`});
        } else {
            res.render('error', {msg: "City Not Found"});
        }
    } catch (err) {
        res.render('error', {msg: "City Not Found"});
        throw err;
    }
});

app.get('/download', async (req, res) => {
    try {
        let name = dCity;
        const city =  await City.find({name: name});
        if(city) {
            let fileName = city[0].itenary;
            let url = `uploads/${fileName}`;
            res.download(url);
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
});

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

module.exports = {
  app
}
