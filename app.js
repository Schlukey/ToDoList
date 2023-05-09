const express = require("express");
const dotenv = require('dotenv').config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://${process.env.USERNAME}${process.env.PASSWORD}@atlascluster.ef9alfa.mongodb.net/`, {
  useNewUrlParser: true,
});

// Creating the Schema
const toDoSchema = {
  name: String,
};

// Creating the Model
const Item = mongoose.model("Item", toDoSchema);
//Creating items
const item1 = new Item({
  name: "Welcome to the todo list.",
});
const item2 = new Item({
  name: "Press the '+' to add new items",
});
//creating an array to store the list items in
const listArray = [item1];

//Create a list Schema
const listSchema = {
  name: String,
  items: [toDoSchema],
};
// create a model for the list schema
const List = mongoose.model("List", listSchema);

//getting the day for the list title of home page
const date = new Date();
const today = date.getDay();
let daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
let day = daysOfWeek[today];

app.get("/", async function (_req, res) {
  //finding the items in the array pushed into the model
  await Item.find({}).then((foundItems) => {
    //if the array is 0 then the start item must be added else no changes made
    if (foundItems.length <= 0) {
      //inserting items from the array into the model
      Item.insertMany(listArray).then(function () {
        console.log("Successfully saved into our DB.");
      });
      res.redirect("/");
    } else {
      res.render("List", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listSearch = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listSearch == day) {
    await item.save();
    //redirect to the home route
    res.redirect("/");
  } else {
    //find the list they working with
    await List.findOne({ name: listSearch })
      .then(function (foundList) {
        //push the new items to the list
        foundList.items.push(item);
        foundList.save();
        //redirect to stay on the list page
        res.redirect(`/${listSearch}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post('/delete', async (req, res) => {
  const completed = req.body.checkBox;
  const listName = req.body.listName;
  console.log(completed);
  
  if (listName === day) {
    // Deleting an item from the main list
    if (completed !== undefined) {
      await Item.findByIdAndRemove(completed)
        .then(() => console.log(`Deleted ${completed} Successfully`))
        .catch((err) => console.log("Deletion Error: " + err));
    }
      res.redirect('/');
  } else {
    // Deleting an item from a custom list
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: completed } } },
      { useFindAndModify: false } // Add this option to avoid deprecation warning
    )
      .then(() => {
        console.log(`Deleted ${completed} from ${listName} Successfully`);
        res.redirect('/' + listName);
      })
      .catch((err) => console.log("Deletion Error: " + err));
  }
});


app.get("/:listID", async (req, res) => {
  const listName = _.capitalize(req.params.listID);
  // Try to find the list
  const foundList = await List.findOne({ name: listName });

  if (foundList === null) {
    // List not found, create a new one
    const newList = new List({
      name: listName,
      items: [],
    });
    await newList.save();
    console.log("New list created");
    res.redirect("/" + listName);
  } else {
    // List found, render it
    console.log("List found");
    res.render("list", { listTitle: listName, newListItems: foundList.items });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});