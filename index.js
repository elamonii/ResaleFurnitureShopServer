const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
// const token = jwt.sign({ foo: 'bar' }, 'shhhhh');

const app = express();

// ============Middleware
app.use(cors());
app.use(express.json());

// ====================================CONNECT WITH MONGODB
// const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gtl5kfx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// ====================VERIFY JWT MIDDLEWARE==============
function verifyJWT(req, res, next){
    // console.log('check jwt', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.send(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden Access'})
        }
        req.decoded = decoded;
        next();
    })
}
// ====================VERIFY JWT MIDDLEWARE==============


async function run(){
    try{
        const usersCollection = client.db('ReuseGoodsPortal').collection('users');
        const categoryCollection = client.db('ReuseGoodsPortal').collection('categories');
        const productCollection = client.db('ReuseGoodsPortal').collection('products');
        const wishlistCollection = client.db('ReuseGoodsPortal').collection('wishlists');

        // ==========================USER====================================
        app.get('/users', async (req, res) => {
            const query = {};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        // =======================GET ALL SELLERS===============
        app.get('/usersSeller', async (req, res) => {
            const query = {role: 'seller'};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        // =======================GET ALL BUYERS===============
        app.get('/usersBuyer', async (req, res) => {
            const query = {role: 'buyer'};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })


        // ========================ADD TO DB IF NOT ADDED YET
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const checkEmail = user.email;
            const checkEmailQuery =  { email: checkEmail }
            const checkUser = await usersCollection.findOne(checkEmailQuery);
            if(checkUser){                    
                res.send(checkUser);
            }else{
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
        })

        // =======================ADMIN CHECK
        app.get('/users/admin/:email', async (req, res) => {
            const emailId = req.params.email;
            const query = { email: emailId }
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});

        })

        // ===========================CHECK IF SELLER
        app.get('/users/seller/:email', async (req, res) => {
            const emailId = req.params.email;
            const query = { email: emailId }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'});
        })


        // ===========================CHECK IF BUYER
        app.get('/users/buyer/:email', async (req, res) => {
            const emailId = req.params.email;
            const query = { email: emailId }
            const user = await usersCollection.findOne(query);
            res.send({isBuyer: user?.role === 'buyer'});
        })
        

        // =====UPDATE A PARTICULAR ONE
        // =======ADMIN ROLE INSERT
        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('got into method');
            const filter = { _id: ObjectId(id)};
            const options = { upsert: true};
            const updatedDoc = {
                $set: { role: 'admin' }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })


        // ===========================VERIFY SELLER
        app.put('/users/sellerVerify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id)};
            const options = { upsert: true};
            const updatedDoc = {
                $set: { sellerVerified: true }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })        


        // =======BUYER OR SELLER ROLE INSERT
        app.put('/users/roleSwitch/:id/:role', async (req, res) => {
            const id = req.params.id;
            const role = req.params.role;
            const filter = { _id: ObjectId(id)};
            const options = { upsert: true};
            const updatedDoc = {
                $set: { role: role }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        // ==========================USER====================================


        // ==========================CATEGORY====================================
        // ------ADD CATEGORY----------
        app.post('/category/add', async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send(result);
        })

        // ------VIEW ALL CATEGORY----------
        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        })


        app.get('/selectCategory', async (req, res) => {
            const query = {};
            const result = await categoryCollection.find(query).project({categoryName: 1}).toArray();
            res.send(result);
        })



        // ==========================CATEGORY=======================================================


        // ==========================PRODUCT=======================================================
        // ------ADD CATEGORY----------
        app.post('/product/add', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })

        // ------VIEW ALL CATEGORY----------
        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        // ======================GET PRODUCTS BY CATEGORY ID=======
        app.get('/productsByCategory/:categoryId', async (req, res) => {
            const categoryId = req.params.categoryId;
            console.log(categoryId);
            const query = { productCategory: categoryId};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        // ======================GET PRODUCTS BY SELLER ID=======
        app.get('/products/productBySeller/:sellerId', async (req, res) => {
            const sellerId = req.params.sellerId;
            console.log('sellerId');
            const query = { userId: sellerId};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })


        // ======================GET SPONSORED PRODUCTS=======
        app.get('/productSponsored', async (req, res) => {
            const query = { sponsored: true};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        // ======================GET PRODUCT DETAILS=======================
        app.get('/productDetails/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id)};
            const result = await productCollection.findOne(filter);
            res.send(result);
        })


        // ======================GET 10 LATEST ADDED PRODUCTS=======
        app.get('/mostRecentProducts', async (req, res) => {
            const query = {};
            const result = await productCollection.find(query).sort({'created': -1}).limit(10).toArray();
            res.send(result);
        })

        // ================================DELETE A SALE PRODUCT
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id)};
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })


        // ==========================PRODUCT===========================================================
        // ==========================WISHLIST===========================================================
        
        // ======================ALLDATA WISHLIST=======
        app.get('/wishlists', async (req, res) => {
            const query = {};
            const result = await wishlistCollection.find(query).toArray();
            res.send(result);
        })


        // ------ADD WISHLIST DATA----------
        app.post('/wishlists/add', async (req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist);
            res.send(result);
        })

        // ======================BUYERS WISHLIST=======
        app.get('/wishlists/:emailId', async (req, res) => {
            const emailId = req.params.emailId;
            const query = { buyerEmail: emailId};
            const result = await wishlistCollection.find(query).toArray();
            res.send(result);
        })

        // ==========================WISHLIST===========================================================


        // ===============================JWT=================
        app.get('/jwt', async (req, res) => {
            console.log('get into jwt');
            const email = req.query.email;
            const query = {
                email:email
            }
            const user = await usersCollection.findOne(query);
            if(user){
                console.log('jwt success');
                console.log(user);
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token})
            }
            // console.log(user);
            res.status(403).send({ accessToken: ''});
        })
        // ===============================JWT=================

        
    }
    finally{

    }

}
run().catch(console.log())




app.get('/', async(req, res) => {
    res.send('Recycle Server server is running');
});

app.listen(port, () => {
    console.log(`Recycle Server running on ${port}`);
});