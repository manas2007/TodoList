const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect local database to our application

mongoose.connect("mongodb://localhost:8080/todolistDB",{useNewUrlParser:true});

// Create a new Schema 

const itemsSchema = {
  name : String
}

// Create A Model for our DB

const Item = mongoose.model("Item",itemsSchema);

// Create Mongoose Documents

const item1 = new Item({
  name : "Hello"
});
const item2 = new Item({
  name : "World"
});
const item3 = new Item({
  name : "Node"
});

const defaultItem = [item1,item2,item3];

// List Schema

const listSchema = {
  name : String,
  items : [itemsSchema]
}

// List Model

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) 
{
   Item.find({}, function(err,result)
   {
      if(result.length === 0)
      {
          Item.insertMany(defaultItem,function(err)
          {
            err ? console.log("Error") : console.log("Success saved default items to DB")
          });
          res.redirect("/");
      }
      else
      {
        res.render("list", {listTitle: "Today", newListItems: result});
      }
   })

});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;

  const item1 = new Item({
    name : item
  });

  if(listName === "Today")
  {
    item1.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name:listName}, function(err,foundList)
    {
        foundList.items.push(item1);
        foundList.save();
        res.redirect("/"+listName);
    })

  }

});

app.post("/delete",function(req,res)
{
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today")
    {
      Item.findByIdAndRemove(itemId,function(err) 
      {
         err ? console.log("Err") : console.log("Item Deleted Successfully");
         res.redirect("/")
      })
    }
    else
    {
        List.findOneAndUpdate({name:listName},{$pull : {items:{_id:itemId}}},function(err,foundList)
        {
          !err ? res.redirect("/"+listName) : console.log("Error");
        })
    }

   
});

app.get("/:Type", function(req,res){
  let t = _.capitalize(req.params.Type);

  const list = new List({
    name : t,
    items : defaultItem
  });

  List.findOne({name:t},function(err,result)
  {
      if(!result)
      {
        const list = new List({
          name : t,
          items : defaultItem
        });
        list.save();
        res.redirect("/"+t);
      }
      else
      {
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
  })


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
