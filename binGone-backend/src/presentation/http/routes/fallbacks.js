import express from 'express';

export function fallbacksRouter() {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({
      salvationArmyLocator: 'https://www.salvationarmyusa.org/usn/location-search/',
      unitedWay211: 'https://www.211.org/',
    });
  });

  return router;
}


