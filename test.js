import { config } from 'dotenv';
config();


//get BLACKLIST from .env array
const BLACKLIST = process.env.BLACKLIST

//get each item in from string separated by comma and add to an array
const blacklist = [];
process.env.BLACKLIST.split(',').forEach(item => {
    blacklist.push(item);
});
console.log(blacklist);