const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Task', taskSchema)

