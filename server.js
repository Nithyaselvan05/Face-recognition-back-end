const express=require('express');
const app=express();
const bcrypt= require('bcrypt-nodejs')
const bodyparser= require('body-parser')
const cors=require('cors')
const knex = require('knex')
const clarifai=require('clarifai')
const db=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'Postgres@0518',
    database : 'smart-brain'
  }
});
const app1 = new Clarifai.App({
 apiKey: '54af97c426854709bd4bc599c37da211'
});

app.use(bodyparser.json())
app.use(cors())

app.get('/',function(req,res){
	res.send(database)
})

app.post("/signin",function(req,res){
	const {email,password}=req.body
	if(!email|| !password ){
		return (res.status(400).json('incorrect form submission'));
	}
	db.select('email','hash').from('login')
		.where('email','=',email)
		.then(data=>{
			const isValid=bcrypt.compareSync(req.body.password, data[0].hash);
			if(isValid){
				db.select('*').from('users')
					.where('email','=',email)
					.then(user=>{
						res.json(user[0])
					})
					.catch(err=>res.status(400).json('error getting user'))
			}
		})
		.catch(err=>res.status(400).json('wrong credentials'))
})
app.post('/imageurl',function(req,res){
	app1.models.predict(
        Clarifai.FACE_DETECT_MODEL,
        req.body.input).then(data=>{
        	res.json(data)
        })
        .catch(err => res.status(400).json('unable to get entries'))
})
app.post("/register",function(req,res){
	// res.send("Boom")
	const {email,name,password}=req.body
	if(!email || !name || !password ){
		return (res.status(400).json('incorrect form submission'));
	}
	var hash = bcrypt.hashSync(password);

	db.transaction(trx=>{
		trx.insert({
			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginemail=>{
			return trx('users')
			.returning('*')
			.insert({
				email:email,
				name:name,
				joined:new Date()
			})
			.then(user=>{
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.then(trx.rollback)
	})
		.catch(err=>res.status(400).json('error logging in'))	
})
app.get('/profile/:id',function(req,res){

	const { id } = req.params;
  db.select('*').from('users').where({id})
    .then(user => {
      if (user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch(err => res.status(400).json('error getting user'))
})
app.put('/image',function(req,res){
	const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('unable to get entries'))
})



// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });
let port=process.env.PORT;
if (port==null||port=="") {
  port=3000;
}
app.listen(port,function(){
	console.log("App running in port 3000")
})