const express = require("express");
const cors = require("cors");
const app = express();
const port = 3008;
const { Sequelize, DataTypes } = require("sequelize");

app.use(cors());
// Express middleware for parsing JSON
app.use(express.json());

//Conexion a l DB

// Database connection

const sequelize = new Sequelize({
    dialect: "mysql",
    host: "localhost",
    username: "root",
    password: "",
    database: "prueba",
});
// Entity class for dynamic table creation
class Entity {
    constructor(name, fields) {
        this.name = name;
        this.model = sequelize.define(name, fields);
    }

    async sync() {
        await this.model.sync({ force: true });
        console.log(`Table for ${this.name} synchronized`);
    }
}

// Define a simple schema for the User entity
const userSchema = {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    user_email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
    },

    user_password: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
    },
};
const appointmentSchema = {
  appointment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  appointment_description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
};

const Appointment = new Entity('Appointment', appointmentSchema);
// Create User entity using the schema
const User = new Entity("User", userSchema);
// Synchronize the database with the defined models.
// This will create the tables if they do not exist
// It will also create the tables with the defined schema
// it will delete the information in the table
User.model.hasMany(Appointment.model, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Appointment.model.belongsTo(User.model, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

const syncronizeDB = async () => {
  await sequelize.sync();
  await User.sync();
  await Appointment.sync();
};

 //syncronizeDB();

 // Tengo dudas con como hacer que el log in funcione bien y si compare la info de la base de datos con la que uno introduce

 

app.post("/user", (req, res) => {
  console.log("req.body");
  console.log(req);
  res.send(user);
});

app.post("/login", async (req, res) => {
  try {
    const { user_email, user_password } = req.body;
    console.log("req.body");
    console.log(req.body);
    const user = await User.model.findOne({
      where: {
        user_email: user_email,
        user_password: user_password,
      },
    });

    if (user) {
      res.status(200).json({ message: "Login successful", user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { user_email, user_name, user_last_name, user_password } = req.body;
    console.log("req.body");
    console.log(req.body);
    const user = await User.model.create({
      user_email,
      user_name,
      user_last_name,
      user_password,
    });

    res.status(201).json({ message: "User created", user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//... (rest of the code remains the same)

app.post('/appointment', async (req, res) => {
  try {
    const { appointment_date, appointment_time, appointment_reason, doctor, service } = req.body;
    const user_id = req.user_id; // assuming you have a way to authenticate and get the user ID
    const appointment = await Appointment.model.create({
      user_id,
      appointment_date,
      appointment_time,
      appointment_reason,
      doctor,
      service,
    });
    res.status(201).json({ message: 'Appointment created', appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.model.findAll();
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/appointments/:appointment_id', async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const appointment = await Appointment.model.findByPk(appointment_id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      res.status(200).json(appointment);
    }
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/appointments/:appointment_id', async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const { appointment_date, appointment_time, appointment_description } = req.body;
    const appointment = await Appointment.model.findByPk(appointment_id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      await appointment.update({
        appointment_date,
        appointment_time,
        appointment_description,
      });
      res.status(204).json({ message: 'Appointment updated' });
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/appointments/:appointment_id', async (req, res) => {
  try {
    const { appointment_id } = req.params;
    await Appointment.model.destroy({
      where: {
        appointment_id,
      },
    });
    res.status(204).json({ message: 'Appointment deleted' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.model.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    await User.model.destroy({
      where: {
        user_id,
      },
    });

    res.status(204).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/users/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { user_email, user_name, user_last_name, user_password } = req.body;
    await User.model.update(
      {
        user_email,
        user_name,
        user_last_name,
        user_password,
      },
      {
        where: {
          user_id,
        },
      }
    );

    res.status(204).json({ message: "User updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
