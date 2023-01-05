const { Router } = require("express");
const { Videogame, Genre } = require("../db.js");
const { API_KEY } = process.env;

// funcion para traer todos los videojuegos de la api por nombre
const getApiVideogamesByName = async (name) => {
    const apiUrl = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${name}&page_size=100`
    );
    const apiInfo = await apiUrl.json();
  
    const apiVideogamesByName = apiInfo.results.map((v) => {
      return {
        id: v.id,
        name: v.name,
        image: v.background_image,
        genres: v.genres.map((g) => g.name),
      };
    });
    return apiVideogamesByName;
  };
  
  // funcion para traer todos los videojuegos de la api
  
  const getApiVideogames = async () => {
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
        id: v.id,
        name: v.name,
        image: v.background_image,
        genres: v.genres.map((g) => g.name),
      };
    });
    return apiVideogamesMapped;
  };
  
  // funcion para traer todos los videojuegos de la base de datos
  const getDbVideogames = async () => {
    return await Videogame.findAll({
      include: {
        model: Genre,
        attributes: ["name"],
        through: {
          attributes: [],
        },
      },
    });
  };
  
  // funcion para traer todos los videojuegos de la api y de la base de datos
  const getAllVideogames = async () => {
    const apiVideogames = await getApiVideogames();
    const dbVideogames = await getDbVideogames();
  
    const dbGames = dbVideogames.map((v) => {
      return {
        id: v.id,
        name: v.name,
        description: v.description,
        released: v.released,
        rating: Number(v.rating),
        platforms: v.platforms,
        genres: v.genres.map((g) => g.name),
        image: v.image,
        createdInDb: true,
      };
    });
  
    const allVideogames = apiVideogames.concat(dbGames);
    return allVideogames;
  };
  
  // funcion videojuegos por id desde la api
  const getApiVideogameById = async (id) => {
    const apiUrl = await fetch(
      `https://api.rawg.io/api/games/${id}?key=${API_KEY}`
    );
    const apiInfo = await apiUrl.json();
    const apiVideogameById = {
      id: apiInfo.id,
      name: apiInfo.name,
      image: apiInfo.background_image,
      description: apiInfo.description,
      released: apiInfo.released,
      rating: apiInfo.rating,
      platforms: apiInfo.platforms.map((p) => p.platform.name),
      genres: apiInfo.genres.map((g) => g.name),
    };
    return apiVideogameById;
  };
  
  // funcion videojuegos por id desde la base de datos
  const getDbVideogameById = async (id) => {
    return await Videogame.findOne({
      where: { id },
      include: {
        model: Genre,
        attributes: ["name"],
        through: {
          attributes: [],
        },
      },
    });
  };
  
  // funcion para traer todos los videojuegos por id
  const getAllVideogameById = async (id) => {
    const apiVideogameById = await getApiVideogameById(id);
    const dbVideogameById = await getDbVideogameById(id);
    const allVideogameById = apiVideogameById.concat(dbVideogameById);
    return allVideogameById;
  };

  module.exports = {
    getApiVideogamesByName,
    getApiVideogames,
    getDbVideogames,
    getAllVideogames,
    getApiVideogameById,
    getDbVideogameById,
    getAllVideogameById,
    
  }