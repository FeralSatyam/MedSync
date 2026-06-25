import { validationResult } from 'express-validator';
import User from '../models/User.js';

// Returns whether the authenticated account owner has configured a dispensing PIN.
export const getDispensingPinStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+dispensingPin');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ isSet: Boolean(user.dispensingPin) });
  } catch (err) {
    next(err);
  }
};

// Sets the dispensing PIN for the first time. Refuses if one already exists
// (use change/reset for that) so an existing PIN can never be silently overwritten.
export const setDispensingPin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { pin } = req.body;
    const user = await User.findById(req.user._id).select('+dispensingPin');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.dispensingPin) {
      return res.status(400).json({ message: 'A dispensing PIN is already set. Use change PIN instead.' });
    }

    user.dispensingPin = String(pin);
    await user.save();

    res.json({ success: true, message: 'Dispensing PIN set successfully.' });
  } catch (err) {
    next(err);
  }
};

// Changes an existing dispensing PIN. Requires the current PIN to authorize.
export const changeDispensingPin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { currentPin, newPin } = req.body;
    const user = await User.findById(req.user._id).select('+dispensingPin');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.dispensingPin) {
      return res.status(400).json({ message: 'No dispensing PIN is set yet. Please set one first.' });
    }

    const ok = await user.matchDispensingPin(currentPin);
    if (!ok) {
      return res.status(401).json({ message: 'Current PIN is incorrect' });
    }

    user.dispensingPin = String(newPin);
    await user.save();

    res.json({ success: true, message: 'Dispensing PIN changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// Recovers a forgotten dispensing PIN. The owner re-authenticates with either
// their previous PIN or their account password before setting a new PIN.
export const resetDispensingPin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { newPin, currentPin, password } = req.body;

    if (!currentPin && !password) {
      return res.status(400).json({ message: 'Provide your previous PIN or account password to continue.' });
    }

    const user = await User.findById(req.user._id).select('+dispensingPin +password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let authorized = false;
    if (currentPin && user.dispensingPin) {
      authorized = await user.matchDispensingPin(currentPin);
    }
    if (!authorized && password) {
      authorized = await user.matchPassword(password);
    }

    if (!authorized) {
      return res.status(401).json({ message: 'Authentication failed. Check your previous PIN or password.' });
    }

    user.dispensingPin = String(newPin);
    await user.save();

    res.json({ success: true, message: 'Dispensing PIN reset successfully.' });
  } catch (err) {
    next(err);
  }
};
