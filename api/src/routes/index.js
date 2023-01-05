const { Router } = require("express");
const { Videogame, Genre } = require("../db.js");
const { API_KEY } = process.env;
const {
  getApiVideogamesByName,
  getApiVideogames,
  getAllVideogames,
  getApiVideogameById,
  
} = require("./controllers");

// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

//--------------------RUTAS--------------------
//CHECK GET VIDEOGAMES Y VIDEOGAMES?NAME=... OK

// ruta para traer todos los videojuegos por nombre
router.get("/videogamesname", async (req, res) => {
  const { name } = req.query;
  try {
    const gameName = await getApiVideogamesByName(name);
    res.status(200).send(gameName);
  } catch (error) {
    res.status(404).send({ message: "No se encontró el juego" });
  }
});

// ruta para traer todos los videojuegos por nombre o todos
router.get("/videogames", async (req, res) => {
  const { name } = req.query;
  try {
    const allVideogames = await getAllVideogames();
    if (name) {
      const videogameName = allVideogames.filter((v) =>
        v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (videogameName.length) {
        res.status(200).send(videogameName);
        console.log(videogameName.length);
      } else {
        res.status(404).send({ message: "No se encontraron coincidencias" });
      }
    } else {
      res.status(200).send(allVideogames);
      console.log(allVideogames.length);
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});

//ruta para traer todos los videojuegos por id
router.get("/videogame/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (id.length > 10) {
      const dbVideogameById = await Videogame.findByPk(id, {
        include: {
          model: Genre,
          attributes: ["name"],
          through: {
            attributes: [],
          },
        },
      });
      if (dbVideogameById) {
        const data = {
          id: dbVideogameById.id,
          name: dbVideogameById.name,
          image: dbVideogameById.image,
          description: dbVideogameById.description,
          released: dbVideogameById.released,
          rating: dbVideogameById.rating,
          platforms: dbVideogameById.platforms,
          genres: dbVideogameById.genres.map((g) => g.name),
          createdInDb: true,
        };
        res.status(200).send(data);
      } else {
        res.status(404).send({ message: "No se encontraron coincidencias" });
      }
    } else {
      const apiVideogameById = await getApiVideogameById(id);
      if (apiVideogameById) {
        res.status(200).send(apiVideogameById);
      } else {
        res.status(404).send({ message: "No se encontraron coincidencias" });
      }
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});

//ruta para encontrar o crear todos los generos
router.get("/genres", async (req, res) => {
  try {
    const genresApi = await fetch(
      `https://api.rawg.io/api/genres?key=${API_KEY}&page_size=50`
    );
    const genresApiJson = await genresApi.json();

    const genres = genresApiJson.results.map((el) => el.name.split("-"));

    const genresEach = genres.map((el) => {
      for (let i = 0; i < el.length; i++) {
        return el[i];
      }
    });
    genresEach.forEach((el) => {
      Genre.findOrCreate({
        where: { name: el },
      });
    });

    const genresDb = await Genre.findAll();
    res.status(200).send(genresDb);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

//ruta para traer de la db todos los videojuegos por genero
router.get("/genresDb", async (req, res) => {
  const data = await Genre.findAll({});
  const dataInfo = data
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
    .map((el) => {
      return {
        name: el.name.charAt(0).toUpperCase() + el.name.slice(1),
      };
    });

  /* let obj = []
  dataInfo.forEach((el) => {
    obj.push(el.name)
  }); */

  res.status(200).send(dataInfo);
});

//ruta para traer plataformas de la api
router.get("/platforms", async (req, res) => {
  const promise1 = fetch(
    `https://api.rawg.io/api/games?key=${API_KEY}&page_size=40&page=1`
  );
  const promise2 = fetch(
    `https://api.rawg.io/api/games?key=${API_KEY}&page_size=40&page=2`
  );
  const promise3 = fetch(
    `https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&page=3`
  );

  const [response1, response2, response3] = await Promise.all([
    promise1,
    promise2,
    promise3,
  ]);
  const [apiInfo1, apiInfo2, apiInfo3] = await Promise.all([
    response1.json(),
    response2.json(),
    response3.json(),
  ]);

  const apiVideogames = apiInfo1.results.concat(
    apiInfo2.results,
    apiInfo3.results
  );

  const apiVideogamesMapped = apiVideogames.map((v) => {
    return {
      platform: v.platforms.map((p) => p.platform.name),
    };
  });

  let platforms = [];

  apiVideogamesMapped.forEach((el) => {
    el.platform.forEach((el) => {
      platforms.push(el);
    });
  });

  const platformSet = [...new Set(platforms)].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  res.status(200).send(platformSet);
});

//ruta para hacer post de un videojuego
router.post("/videogame", async (req, res) => {
  const { name, description, released, rating, platforms, genres, image } =
    req.body;
  if (genres.length === 0) {
    res.status(400).send({
      name: "SequelizeValidationError",
      errors: [
        {
          message: "Genres: Select one or more genres",
        },
      ],
    });
  } else {
    try {
      const newVideogame = await Videogame.create({
        name,
        description,
        released,
        rating,
        platforms,
        image,
      });

      const genresDb = await Genre.findAll({
        where: { name: genres },
      });
      newVideogame.addGenres(genresDb);
      res.status(200).send(newVideogame);

      /* if (name && description && released && rating && platforms && genres) {
      }  */
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        res.status(400).send(error);
      } else {
        res.status(500).send(error);
      }
    }
  }
});

//ruta put para modificar un videojuego
router.put("/videogame/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { name, description, released, rating, platforms, genres } = req.body;
    if (name && description && released && rating && platforms && genres) {
      const videogame = await Videogame.findByPk(id);
      const genresDb = await Genre.findAll({
        where: { name: genres },
      });
      videogame.name = name;
      videogame.description = description;
      videogame.released = released;
      videogame.rating = rating;
      videogame.platforms = platforms;
      videogame.setGenres(genresDb);
      await videogame.save();
      res.status(200).json("Videogame updated");
    } else {
      res.status(404).send({ message: "missing data" });
    }
  } catch (error) {
    res.status(404).send(error.message);
  }
});

//ruta delete para eliminar un videojuego
router.delete("/videogame/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const videogame = await Videogame.findByPk(id);
    await videogame.destroy();
    res.status(200).json("Videogame deleted");
  } catch (error) {
    res.status(404).send(error.message);
  }
});

//probando
router.get("/reviews", async (req, res) => {
  try {
    const all = await getApiVideogames();
    const allMapped = all.map((el) => {
      return {
        id: el.id,
        name: el.name,
        image: el.image,
        rating: el.rating,
      };
    });
    res.status(200).send(allMapped);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

module.exports = router;
