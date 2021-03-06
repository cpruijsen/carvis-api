const API_KEY = process.env.CARVIS_API_KEY;

export default (req, res, next) => {
  const token = req.headers['x-access-token'] || req.body.token || req.query.token || null;
  if (API_KEY === token) {
    return next();
  } else {
    res.json({ message: 'invalid API key' });
  }
}
