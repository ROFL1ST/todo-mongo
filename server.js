const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const router = require("./routes/routes");
const app = express()
const port = "8000"
const uri = "mongodb+srv://rofl1st:Assasudin2@cluster0.4zkb2ub.mongodb.net/?retryWrites=true&w=majority"
app.use(cors());
app.use(express.json());
app.use("/api", router);

mongoose.connect(uri).then(() => {
    console.log("Connect");
}).catch((err) => {
    console.log(err);
})

app.listen(port, () => {
    console.log(`Server Berjalan di port ${port} Berhasil`);
  });
  