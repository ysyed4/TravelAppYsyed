const jwt = require('jsonwebtoken');
const JWT_SECRET=process.env.JWT_SECRET;
const authMiddleware = (req, res, next) =>{
    const authHeader = req.header('Authorization');
    if(!authHeader){
        return res.status(401).json({message:'Access denied, No token'});
    }
    const token =authHeader.split(' ')[1];
    if(!token){
        return res.status(401).json({message:'Access denied, invalid token'});
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user= decoded;
        next()
    }
    catch(error){
        res.status(400).json({message: 'Invalid token'})
    }
};
module.exports = authMiddleware;