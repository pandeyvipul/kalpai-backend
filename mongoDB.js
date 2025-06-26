const mongoose = require('mongoose');

const URI = "mongodb+srv://vipul:C5hYomV0TrP86IPL@cluster0.yq0kbo9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const mongoCheck = async () => {
    try {
        await mongoose.connect(URI);
        const db = mongoose.connection.useDb("kalp"); // Explicitly use the 'kalp' database
    const collection = db.collection("important_info");
    
    const data = await collection.findOne({});
    // console.log("Data from MongoDB:", data.data);
    console.log("Connnnnnnnnnnnnnnnnnected");
    return data.data;

    } catch (error) {
        console.log(error);
    }
}

module.exports = mongoCheck;