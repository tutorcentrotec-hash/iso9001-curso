// SCORM 1.2 API wrapper
// Comunica progreso, score y estado al LMS (Moodle)

var SCORM = (function () {
  var API = null;
  var initialized = false;

  // Buscar la API SCORM en la ventana padre
  function findAPI(win) {
    var tries = 0;
    while (win.API == null && win.parent != null && win.parent != win) {
      tries++;
      if (tries > 10) return null;
      win = win.parent;
    }
    return win.API;
  }

  function getAPI() {
    var theAPI = findAPI(window);
    if (theAPI == null && window.opener != null) {
      theAPI = findAPI(window.opener);
    }
    return theAPI;
  }

  function init() {
    API = getAPI();
    if (API == null) {
      console.warn("SCORM API no encontrada. Ejecutando sin LMS.");
      return false;
    }
    var result = API.LMSInitialize("");
    initialized = (result === "true" || result === true);
    return initialized;
  }

  function setValue(element, value) {
    if (!initialized || API == null) return;
    API.LMSSetValue(element, value);
  }

  function getValue(element) {
    if (!initialized || API == null) return "";
    return API.LMSGetValue(element);
  }

  function commit() {
    if (!initialized || API == null) return;
    API.LMSCommit("");
  }

  function finish() {
    if (!initialized || API == null) return;
    API.LMSFinish("");
  }

  // Iniciar sesión
  init();

  // Marcar como "en progreso" al iniciar
  setValue("cmi.core.lesson_status", "incomplete");
  setValue("cmi.core.session_time", "00:00:01");
  commit();

  return {
    // Reportar progreso (0-100)
    setProgress: function (pct) {
      setValue("cmi.core.score.raw", pct);
      setValue("cmi.core.score.min", "0");
      setValue("cmi.core.score.max", "100");
      if (pct >= 70) {
        setValue("cmi.core.lesson_status", "passed");
      } else {
        setValue("cmi.core.lesson_status", "incomplete");
      }
      commit();
    },

    // Marcar como completado
    complete: function (score) {
      setValue("cmi.core.score.raw", score || 100);
      setValue("cmi.core.score.min", "0");
      setValue("cmi.core.score.max", "100");
      setValue("cmi.core.lesson_status", score >= 70 ? "passed" : "failed");
      commit();
    },

    // Guardar bookmark (slide actual)
    setBookmark: function (slideIndex) {
      setValue("cmi.core.lesson_location", slideIndex.toString());
      commit();
    },

    // Recuperar bookmark
    getBookmark: function () {
      var loc = getValue("cmi.core.lesson_location");
      return loc ? parseInt(loc) : 0;
    },

    finish: finish
  };
})();

// Cerrar sesión al salir de la página
window.addEventListener("beforeunload", function () {
  SCORM.finish();
});
