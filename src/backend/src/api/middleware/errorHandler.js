export default (err, req, res, next) => {
  console.error(err);
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ error: err.message });
};
