const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentsRouter = require('./routes/students');
const availabilityRouter = require('./routes/availability');
const freeSlotsRouter = require('./routes/freeSlots');
const activityRouter = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/skills', require('./routes/skills'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/students', require('./routes/students'));
app.use('/api/free-slots', require('./routes/freeSlots'));
app.use('/api/activities', activityRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});