
// requires express module Just as other modules to enable middleware capabilities
var express = require("express");

const mongoose = require( 'mongoose' );
const Book = require("./models/book");
const Member = require("./models/member");
const AuthService = require('./utils/auth-service');


var http = require("http");

//Calls express  function to start a new Express application
var app = express();


const path = require('path');
const fs =require('fs')

//Note we have used express middleware
// Added a request handler in express
const cors = require('cors') 
app.use( cors() )
app.use( express.urlencoded( { extended: false } ) );
app.use( express.json() )


app.use('/assets', express.static('assets'))

app.use((request, response, next) => {
    console.log("Logging IP : " + request.ip + " on time " + new Date());
    next();

});
app.use((request, response, next) => {
    console.log("Logging Request from url : " + request.url);
    next();

});


//Authentication middleware
app.use(function( request, response, next ) {

    if( request.url.includes( '/login' ) ||  request.url.includes( '/books/search' ) ||  request.url.includes( '/assets' ) ) {
            next();
            return;
        }

    try {
        let userResponse = AuthService.verify(request);         
        console.log(userResponse);

        // Add further validation if you would like for specific urls based on role.
        next();

    } catch (error) {
        console.error(error);
        return response.status( 401 ).json({
            message: 'You are not authorized to access this endpoint'
        });
    }         

});



app.use('/books', require('./routes/books'));
app.use('/members', require('./routes/members'));
app.use( require( './routes/authentication' ) );
app.use( require( './routes/assign-release' ) );





app.use(function (request, response) {

    response.end("Hello, Everyone!");
});
  



async function populateData(){

    //if no data ,insert some data
    const count = await  Book.countDocuments({}).exec()

    if(count ==0){

        var existingBooks = [{ title: "The Power of your Subconscious Mind", price: 296, author: "Joseph Murphy", category: "self-help", publishYear: 2015, availableCopies: 3, totalCopies: 50, imageUrl: "http://localhost:3000/assets/books/SELF-HELP-0001.jpg" },
        {  title: "Great Gatsby", price: 240, author: "F. Scott Fitzgerald", category: "literature", publishYear: 1939, availableCopies: 2, totalCopies: 8, imageUrl: "http://localhost:3000/assets/books/LITERATURE-0002.jpg" }];

        const res = await  Book.insertMany(existingBooks);

        console.log(res);


    }
    

}
async function populateMemberData(){

    //if no data ,insert some data
    const count = await  Member.countDocuments({}).exec()

    if(count ==0){

        const existingMembers =  [
            {
                "name": "Bob Johnson",
                "username": "bjohn",
                "password": "bjohn",
                "startDate": "2010-02-04T00:00:00.000Z",
                "endDate": "2030-03-03T00:00:00.000Z",
                "role": "admin",
                "imageUrl":"http://localhost:3000/assets/members/STU-2722.jpg"
            },
            {
                "name": "John Doe",
                "username": "johndoe",
                "password": "johndoe",
                "startDate": "2019-02-04T00:00:00.000Z",
                "endDate": "2020-03-03T00:00:00.000Z",
                "role": "member",
                 "imageUrl":"http://localhost:3000/assets/members/FAC-0078.jpg"
            }]
        const res = await  Member.insertMany(existingMembers);



    }
    

}


async function initDb(){

    try {
        await mongoose.connect( 'mongodb://localhost:27017/library-app-node',  { useNewUrlParser: true } );
        
        await populateData();
        await populateMemberData();
    } catch (error) {
        console.error(error)
        throw error
    }

}


function startServer(){    
    //Set the http server to listen on port 3000 and use express
    http.createServer(app).listen(3000);
    console.log("server Started")
}



initDb().then((res)=>{

    startServer();
 
}).catch((ex)=>{

    console.log("Database Initialization failed , No need to setup routes, Exiting...")
})
