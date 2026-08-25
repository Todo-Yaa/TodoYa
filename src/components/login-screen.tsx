import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView, Platform, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useUser, UserRole } from '../context/user-context';
import { router } from 'expo-router'; // Importar enrutador para redireccionar tras login dinámico
import KYCVerifierModal from './kyc-verifier-modal';
import TermsPrivacyModal from './terms-privacy-modal';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '../utils/security';

const PAISES_LATINOS = [
  { nombre: "Perú", codigo: "51", bandera: "🇵🇪" },
  { nombre: "Bolivia", codigo: "591", bandera: "🇧🇴" },
  { nombre: "Colombia", codigo: "57", bandera: "🇨🇴" },
  { nombre: "Ecuador", codigo: "593", bandera: "🇪🇨" },
  { nombre: "Chile", codigo: "56", bandera: "🇨🇱" },
  { nombre: "Argentina", codigo: "54", bandera: "🇦🇷" },
  { nombre: "México", codigo: "52", bandera: "🇲🇽" },
  { nombre: "Venezuela", codigo: "58", bandera: "🇻🇪" },
  { nombre: "Paraguay", codigo: "595", bandera: "🇵🇾" },
  { nombre: "Uruguay", codigo: "598", bandera: "🇺🇾" },
  { nombre: "Brasil", codigo: "55", bandera: "🇧🇷" },
  { nombre: "Costa Rica", codigo: "506", bandera: "🇨🇷" },
  { nombre: "Panamá", codigo: "507", bandera: "🇵🇦" },
  { nombre: "Guatemala", codigo: "502", bandera: "🇬🇹" },
  { nombre: "El Salvador", codigo: "503", bandera: "🇸🇻" },
  { nombre: "Honduras", codigo: "504", bandera: "🇭🇳" },
  { nombre: "Nicaragua", codigo: "505", bandera: "🇳🇮" },
  { nombre: "República Dominicana", codigo: "1-809", bandera: "🇩🇴" },
];

/**
 * Componente LoginScreen:
 * Interfaz de inicio de sesión premium y lógica de autenticación/registro social simulado.
 * Todos los métodos, variables y parámetros nuevos están en español para su fácil lectura y modificación.
 */
export default function LoginScreen() {
  const {
    login,
    usuariosRegistrados,
    registrarEIniciarSesion,
    registrarUsuario,
    actualizarKYC,
    startClientSimulation,
    startProviderSimulation,
  } = useUser();
  const [correoOTelefono, setCorreoOTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false); // Spinner de carga al enviar

  // Estados del Registro Manual
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombreRegistro, setNombreRegistro] = useState("");
  const [correoOTelefonoRegistro, setCorreoOTelefonoRegistro] = useState("");
  const [contrasenaRegistro, setContrasenaRegistro] = useState("");
  const [tipoEntidad, setTipoEntidad] = useState<"natural" | "empresa">(
    "natural",
  );
  const [nit, setNit] = useState("");
  const [correoFacturacion, setCorreoFacturacion] = useState("");
  const [rubro, setRubro] = useState("Papelería");
  const [b2bRol, setB2bRol] = useState<"client" | "provider">("client");
  const [naturalRol, setNaturalRol] = useState<"client" | "provider">("client");

  // Nuevos campos de celular y país (Perú +51 por defecto)
  const [codigoPais, setCodigoPais] = useState("51");
  const [celular, setCelular] = useState("");

  const [correoRegistro, setCorreoRegistro] = useState("");
  const [mostrarPaises, setMostrarPaises] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Estados de verificación doble por PIN SMS
  const [mostrarModalPIN, setMostrarModalPIN] = useState(false);
  const [pinGenerado, setPinGenerado] = useState("");
  const [pinIngresado, setPinIngresado] = useState("");
  const [smsCountdown, setSmsCountdown] = useState(60);
  const [smsToastText, setSmsToastText] = useState<string | null>(null);
  const [pinError, setPinError] = useState("");

  // Temporizador para SMS countdown
  useEffect(() => {
    let timer: any;
    if (mostrarModalPIN && smsCountdown > 0) {
      timer = setInterval(() => {
        setSmsCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mostrarModalPIN, smsCountdown]);

  // Estado del Modal de Verificación KYC
  const [mostrarKYC, setMostrarKYC] = useState(false);
  const [pendingRegistroData, setPendingRegistroData] = useState<any>(null); // Datos del registro pendiente de KYC

  // Estado del Modal de Términos, Privacidad y Cumplimiento Legal (App Store)
  const [mostrarLegalModal, setMostrarLegalModal] = useState(false);
  const [termsTab, setTermsTab] = useState<"terms" | "privacy" | "compliance">(
    "terms",
  );

  // Configuración del modal de error/éxito personalizado
  const [mostrarModal, setMostrarModal] = useState(false);
  const [configuracionModal, setConfiguracionModal] = useState({
    titulo: "",
    mensaje: "",
  });

  // Estados de la simulación de OAuth Social (Google / LinkedIn) en español
  const [proveedorOauth, setProveedorOauth] = useState<
    "google" | "linkedin" | null
  >(null);
  const [pasoOauth, setPasoOauth] = useState<
    "login" | "register" | "loading" | null
  >(null);
  const [correoOauth, setCorreoOauth] = useState("");
  const [nombreOauth, setNombreOauth] = useState("");
  const [rolOauth, setRolOauth] = useState<UserRole>("client");
  const [correoOauthPersonalizado, setCorreoOauthPersonalizado] = useState("");
  const [
    mostrarEntradaCorreoPersonalizado,
    setMostrarEntradaCorreoPersonalizado,
  ] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarContrasenaRegistro, setMostrarContrasenaRegistro] = useState(false);

  /**
   * Envia el mensaje directo de verificación por WhatsApp usando enlace profundo (wa.me)
   */
  const abrirWhatsAppConPin = (code: string) => {
    const celLimpio = celular.replace(/\D/g, "");
    const codPaisLimpio = codigoPais.replace(/\D/g, "");
    const numCompleto = `${codPaisLimpio}${celLimpio}`;
    const mensaje = `🔑 *Todo Ya (BETA)* - Tu código de verificación de seguridad de 4 dígitos es: *${code}*`;
    const url = `https://wa.me/${numCompleto}?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url).catch((err) => {
      console.warn("No se pudo abrir WhatsApp directamente:", err);
    });
  };

  /**
   * Envia el mensaje directo de verificación por SMS nativo
   */
  const abrirSmsConPin = (code: string) => {
    const celLimpio = celular.replace(/\D/g, "");
    const codPaisLimpio = codigoPais.replace(/\D/g, "");
    const numCompleto = `+${codPaisLimpio}${celLimpio}`;
    const mensaje = `SMS Todo Ya (BETA): Tu código de verificación es ${code}`;
    const separator = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${numCompleto}${separator}body=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url).catch((err) => {
      console.warn("No se pudo abrir la app de SMS:", err);
    });
  };

  /**
   * Genera el PIN de verificación y envía mensaje real a celular por API, WhatsApp o SMS
   */
  const enviarSmsPin = async (canal: "auto" | "whatsapp" | "sms" = "auto") => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setPinGenerado(code);
    setPinIngresado("");
    setSmsCountdown(60);
    setPinError("");
    setSmsToastText(null); // No utilizar toasts simulados en pantalla

    const celLimpio = celular.replace(/\D/g, "");
    const codPaisLimpio = codigoPais.replace(/\D/g, "");
    const fullPhone = `+${codPaisLimpio}${celLimpio}`;

    // Disparar endpoint serverless para envío real
    try {
      fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code, channel: canal }),
      }).catch((err) => console.warn("[SMS API Error]:", err));
    } catch (e) {}

    // Transmisión inmediata mediante aplicación nativa o web
    if (canal === "whatsapp") {
      abrirWhatsAppConPin(code);
    } else if (canal === "sms") {
      abrirSmsConPin(code);
    } else {
      // Por defecto en auto, abrir el canal de mensajes directamente al teléfono del usuario
      if (Platform.OS === "web") {
        abrirWhatsAppConPin(code);
      } else {
        abrirSmsConPin(code);
      }
    }
  };

  const confirmarPinYRegistrar = async () => {
    if (pinIngresado !== pinGenerado) {
      setPinError("Código PIN incorrecto. Inténtalo de nuevo.");
      return;
    }

    setMostrarModalPIN(false);

    if (tipoEntidad === "empresa") {
      setPendingRegistroData({
        nombre: nombreRegistro.trim(),
        correo: correoRegistro.trim().toLowerCase(),
        contrasena: contrasenaRegistro,
        tipoEntidad,
        nit: nit.trim(),
        correoFacturacion: correoFacturacion.trim(),
        rubro,
        celular,
        codigoPais,
      });
      setMostrarKYC(true);
      return;
    }

    setCargando(true);
    setTimeout(async () => {
      const finalRole: UserRole = "client";

      const exito = await registrarUsuario(
        nombreRegistro.trim(),
        correoRegistro.trim().toLowerCase(),
        finalRole,
        contrasenaRegistro,
        tipoEntidad,
        undefined,
        undefined,
        undefined,
        false,
        celular,
        codigoPais,
      );

      setCargando(false);
      if (exito) {
        setConfiguracionModal({
          titulo: "¡Registro Exitoso!",
          mensaje:
            "Tu cuenta ha sido creada correctamente.¡Bienvenido a Todo Ya!",
        });
        setMostrarModal(true);
        setEsRegistro(false);
        setNombreRegistro("");
        setCelular("");
        setCorreoRegistro("");
        setContrasenaRegistro("");
      } else {
        setConfiguracionModal({
          titulo: "Error de Registro",
          mensaje:
            "El correo o número de teléfono ingresado ya existe. Inténtalo con otro.",
        });
        setMostrarModal(true);
      }
    }, 1200);
  };

  /**
   * Registra manualmente un nuevo usuario en la app.
   */
  const manejarRegistroManual = async () => {
    if (!nombreRegistro.trim()) {
      setConfiguracionModal({
        titulo: "Nombre vacío",
        mensaje: "Por favor ingresa tu nombre o razón social.",
      });
      setMostrarModal(true);
      return;
    }
    if (!correoRegistro.trim() || !correoRegistro.includes("@")) {
      setConfiguracionModal({
        titulo: "Correo inválido",
        mensaje: "Por favor ingresa un correo electrónico de registro válido.",
      });
      setMostrarModal(true);
      return;
    }
    if (!celular.trim() || celular.length < 7) {
      setConfiguracionModal({
        titulo: "Celular vacío o corto",
        mensaje: "Por favor ingresa tu número de celular (mínimo 7 dígitos).",
      });
      setMostrarModal(true);
      return;
    }
    if (!contrasenaRegistro.trim() || contrasenaRegistro.length < 4) {
      setConfiguracionModal({
        titulo: "Contraseña inválida",
        mensaje: "La contraseña debe tener al menos 4 caracteres.",
      });
      setMostrarModal(true);
      return;
    }

    if (!aceptaTerminos) {
      setConfiguracionModal({
        titulo: "Términos no aceptados",
        mensaje: "Debes aceptar los Términos de Servicio y la Política de Privacidad para registrarte.",
      });
      setMostrarModal(true);
      return;
    }

    if (tipoEntidad === "empresa") {
      if (!nit.trim()) {
        setConfiguracionModal({
          titulo: "NIT vacío",
          mensaje: "Por favor ingresa el NIT de la empresa.",
        });
        setMostrarModal(true);
        return;
      }
      if (!correoFacturacion.trim()) {
        setConfiguracionModal({
          titulo: "Correo de facturación vacío",
          mensaje: "Por favor ingresa tu correo de facturación electrónica.",
        });
        setMostrarModal(true);
        return;
      }
    }

    enviarSmsPin();
    setMostrarModalPIN(true);
  };

  /**
   * Callback que ejecuta el registro definitivo después de verificar KYC con éxito.
   * Ahora persiste el resultado del KYC de Gemini en Neon DB.
   */
  const completarRegistroConKYC = async (kycDetalles: string) => {
    setMostrarKYC(false);
    if (!pendingRegistroData) return;

    setCargando(true);
    const {
      nombre,
      correo,
      contrasena,
      tipoEntidad: te,
      nit: n,
      correoFacturacion: cf,
      rubro: rb,
      celular: cel,
      codigoPais: cp,
    } = pendingRegistroData;
    const finalRole: UserRole = "business";

    const exito = await registrarUsuario(
      nombre,
      correo,
      finalRole,
      contrasena,
      te,
      n,
      cf,
      rb,
      true,
      cel,
      cp,
    );

    // Persistir estado KYC verificado en Neon DB
    if (exito) {
      await actualizarKYC(kycDetalles);
    }
    setCargando(false);
    setPendingRegistroData(null);

    if (exito) {
      setConfiguracionModal({
        titulo: "🎉 ¡Registro y KYC Exitoso!",
        mensaje: `Identidad verificada con Gemini AI. Tu cuenta empresarial ha sido activada. ¡Bienvenido a Todo Ya, ${nombre}!`,
      });
      setMostrarModal(true);
      setEsRegistro(false);
      setNombreRegistro("");
      setCelular("");
      setCorreoRegistro("");
      setContrasenaRegistro("");
      setNit("");
      setCorreoFacturacion("");
    } else {
      setConfiguracionModal({
        titulo: "Error de Registro",
        mensaje:
          "El correo o teléfono ingresado ya existe. Inténtalo con otro.",
      });
      setMostrarModal(true);
    }
  };

  /**
   * Intenta iniciar sesión con las credenciales normales introducidas.
   * Valida campos vacíos y simula un tiempo de respuesta de red antes de autenticar.
   */
  const manejarLoginNormal = async () => {
    // Validación de usuario/celular vacío
    if (!correoOTelefono.trim()) {
      setConfiguracionModal({
        titulo: "Correo o Teléfono vacío",
        mensaje:
          "Por favor ingresa tu número de teléfono o correo electrónico para continuar.",
      });
      setMostrarModal(true);
      return;
    }
    // Validación de contraseña vacía
    if (!contrasena.trim()) {
      setConfiguracionModal({
        titulo: "Contraseña vacía",
        mensaje: "Por favor ingresa tu contraseña.",
      });
      setMostrarModal(true);
      return;
    }

    setCargando(true);
    const cleanUser = sanitizeText(correoOTelefono);
    const cleanPass = contrasena.trim();
    setTimeout(async () => {
      const exito = await login(cleanUser, cleanPass);
      setCargando(false);
      if (!exito) {
        setConfiguracionModal({
          titulo: '❌ Error de Conexión',
          mensaje: 'Hubo un problema al iniciar sesión. Inténtalo de nuevo.'
        });
        setMostrarModal(true);
      }
    }, 1200);
  };

  /**
   * Completa automáticamente los campos del formulario, define el rol forzado para el botón de prueba
   * y realiza el inicio de sesión automático y redirección inmediata para agilizar las pruebas.
   */
  const manejarAccesoRapido = async (usuarioDemo: string) => {
    setCorreoOTelefono(usuarioDemo);
    setContrasena("demo1234");
    setCargando(true); // Activar indicador de carga para dar feedback visual

    // Determinar qué rol debe tener el usuario al loguearse mediante el botón de prueba de acceso rápido
    let forceRole: UserRole = "client";
    if (usuarioDemo === "empresa@todoya.com") {
      forceRole = "business";
    } else if (
      usuarioDemo === "juan.rios@todoya.com" ||
      usuarioDemo === "proveedor_empresa@todoya.com"
    ) {
      forceRole = "provider";
    }

    // Retraso artificial mínimo de 400ms para simular la autenticación y dar feedback
    setTimeout(async () => {
      const exito = await login(usuarioDemo, "demo1234", forceRole);
      setCargando(false); // Desactivar carga
      if (exito) {
        // Redireccionar inmediatamente según el rol forzado para evitar quedarse en pantallas incorrectas
        if (forceRole === "provider") {
          router.replace("/leads");
        } else {
          router.replace("/");
        }
      } else {
        setConfiguracionModal({
          titulo: "Error de Acceso Rápido",
          mensaje:
            "No se pudo iniciar sesión automáticamente con la cuenta de prueba.",
        });
        setMostrarModal(true);
      }
    }, 400);
  };

  /**
   * Inicia el flujo de autenticación social flotante (OAuth)
   */
  /**
   * Inicia el flujo de autenticación social flotante (OAuth Real o Simulado como fallback)
   */
  const iniciarOauth = async (proveedor: "google" | "linkedin") => {
    const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const linkedinClientId = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID;

    // 1. FLUJO DE GOOGLE REAL
    if (proveedor === "google" && googleClientId) {
      const redirectUri =
        Platform.OS === "web"
          ? window.location.origin
          : "https://todo-ya.vercel.app";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=profile%20email`;

      if (Platform.OS === "web") {
        window.location.href = authUrl;
      } else {
        try {
          const WebBrowser = await import("expo-web-browser");
          const result = await WebBrowser.openAuthSessionAsync(
            authUrl,
            redirectUri,
          );
          if (result.type === "success" && result.url) {
            const hashIdx = result.url.indexOf("#");
            if (hashIdx !== -1) {
              const hash = result.url.substring(hashIdx + 1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get("access_token");
              if (accessToken) {
                setCargando(true);
                const googleRes = await fetch(
                  `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
                );
                if (googleRes.ok) {
                  const profile = await googleRes.json();
                  const email = profile.email;
                  const name = profile.name || email.split("@")[0];
                  await registrarEIniciarSesion(
                    name,
                    email,
                    "client",
                    "google",
                  );
                }
                setCargando(false);
              }
            }
          }
        } catch (e) {
          console.warn("Error en Google Sign-In nativo:", e);
        }
      }
      return;
    }

    // 2. FLUJO DE LINKEDIN REAL
    if (proveedor === "linkedin" && linkedinClientId) {
      const redirectUri =
        Platform.OS === "web"
          ? window.location.origin
          : "https://todo-ya.vercel.app";
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;

      if (Platform.OS === "web") {
        window.location.href = authUrl;
      } else {
        try {
          const WebBrowser = await import("expo-web-browser");
          const result = await WebBrowser.openAuthSessionAsync(
            authUrl,
            redirectUri,
          );
          if (result.type === "success" && result.url) {
            const urlObj = new URL(result.url);
            const code = urlObj.searchParams.get("code");
            if (code) {
              setCargando(true);
              const res = await fetch("/api/auth-linkedin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, redirectUri }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.status === "success") {
                  await registrarEIniciarSesion(
                    data.name,
                    data.email,
                    "client",
                    "linkedin",
                  );
                }
              }
              setCargando(false);
            }
          }
        } catch (e) {
          console.warn("Error en LinkedIn Sign-In nativo:", e);
        }
      }
      return;
    }

    // 3. APERTURA INMEDIATA DE VENTANA DE AUTENTICACIÓN (Elegante y sin alertas molestas)
    setProveedorOauth(proveedor);
    setPasoOauth("login");
    setCorreoOauth("");
    setNombreOauth("");
    setRolOauth("client");
    setCorreoOauthPersonalizado("");
    setMostrarEntradaCorreoPersonalizado(false);
  };


  /**
   * Procesa la selección o ingreso de un correo en la ventana de simulación OAuth.
   * - Si la cuenta ya existe, inicia sesión directamente.
   * - Si la cuenta no existe, redirige al paso de Registro para seleccionar rol.
   */
  const manejarSeleccionCorreoOauth = (correoSeleccionado: string) => {
    setCorreoOauth(correoSeleccionado);

    // Sugiere un nombre basado en las primeras letras del correo
    const partes = correoSeleccionado.split("@")[0];
    const nombreSugerido = partes
      .split(".")
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(" ");
    setNombreOauth(nombreSugerido);

    setPasoOauth("loading");

    // Retraso para simular comunicación con el proveedor OAuth
    setTimeout(() => {
      const usuarioExiste = usuariosRegistrados.find((u) => {
        // Búsqueda robusta para evitar errores de undefined con datos antiguos de localStorage
        const correoRegistrado = (
          u.correoOTelefono ||
          (u as any).emailOrPhone ||
          ""
        ).toLowerCase();
        return correoRegistrado === correoSeleccionado.toLowerCase();
      });

      if (usuarioExiste) {
        // Cuenta existente: Inicia sesión directamente respetando sus datos
        registrarEIniciarSesion(
          usuarioExiste.nombre,
          usuarioExiste.correoOTelefono,
          usuarioExiste.rol,
          proveedorOauth || "google",
        );
        setProveedorOauth(null);
        setPasoOauth(null);
      } else {
        // Cuenta nueva: Ir al paso de registro y selección de rol
        setPasoOauth("register");
      }
    }, 1500);
  };

  /**
   * Envía el correo ingresado manualmente en el flujo de Google
   */
  const manejarEnvioCorreoPersonalizado = () => {
    const correo = correoOauthPersonalizado.trim();
    if (!correo || !correo.includes("@")) {
      setConfiguracionModal({
        titulo: "Correo inválido",
        mensaje:
          "Por favor ingresa una dirección de correo electrónico válida.",
      });
      setMostrarModal(true);
      return;
    }
    manejarSeleccionCorreoOauth(correo);
  };

  /**
   * Maneja el flujo de autenticación de LinkedIn
   */
  const manejarAutenticacionLinkedIn = (
    correoLinkedIn: string,
    nombreLinkedIn: string,
  ) => {
    setCorreoOauth(correoLinkedIn);
    setNombreOauth(nombreLinkedIn);
    setPasoOauth("loading");

    setTimeout(() => {
      const usuarioExiste = usuariosRegistrados.find((u) => {
        // Búsqueda robusta para evitar errores de undefined con datos antiguos de localStorage
        const correoRegistrado = (
          u.correoOTelefono ||
          (u as any).emailOrPhone ||
          ""
        ).toLowerCase();
        return correoRegistrado === correoLinkedIn.toLowerCase();
      });
      if (usuarioExiste) {
        registrarEIniciarSesion(
          usuarioExiste.nombre,
          usuarioExiste.correoOTelefono,
          usuarioExiste.rol,
          "linkedin",
        );
        setProveedorOauth(null);
        setPasoOauth(null);
      } else {
        setPasoOauth("register");
      }
    }, 1500);
  };

  /**
   * Ejecuta el registro final del usuario social ingresándolo a la app.
   */
  const manejarRegistroCompleto = () => {
    if (!nombreOauth.trim()) {
      setConfiguracionModal({
        titulo: "Nombre vacío",
        mensaje: "Por favor introduce tu nombre para completar el registro.",
      });
      setMostrarModal(true);
      return;
    }

    setPasoOauth("loading");

    setTimeout(async () => {
      await registrarEIniciarSesion(
        nombreOauth,
        correoOauth,
        rolOauth,
        proveedorOauth || "google",
      );

      setConfiguracionModal({
        titulo: "¡Registro Exitoso!",
        mensaje: `Te has registrado correctamente con tu cuenta de ${proveedorOauth === "google" ? "Google" : "LinkedIn"}. ¡Bienvenido a Todo Ya, ${nombreOauth}!`,
      });
      setMostrarModal(true);

      setProveedorOauth(null);
      setPasoOauth(null);
    }, 1200);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Círculos decorativos en el fondo con transparencias */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <View style={styles.content}>
        {/* Sección de Encabezado y Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo-inicio.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 30, fontWeight: "900", color: "#FFB400", letterSpacing: 1 }}>Todo Ya</Text>
            <View style={{ backgroundColor: "#e11d48", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}>
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900", letterSpacing: 1.5 }}>BETA</Text>
            </View>
          </View>
          <Text style={styles.tagline}>¿Tienes problemas? Ten ¡Todo Ya!</Text>
        </View>

        {/* Tarjeta de Formulario de Entrada */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {esRegistro ? "Crear Cuenta" : "Iniciar Sesión"}
          </Text>

          {esRegistro ? (
            // FORMULARIO DE REGISTRO MANUAL
            <ScrollView
              style={{ maxHeight: Platform.OS === "web" ? 550 : 320 }}
              showsVerticalScrollIndicator={Platform.OS !== "web"}
            >
              {/* Selector de Tipo de Entidad (Persona Natural vs Empresa) */}
              <Text style={styles.inputLabel}>¿Cómo te registras?</Text>
              <View style={styles.entityToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.entityToggleBtn,
                    tipoEntidad === "natural" && styles.entityToggleActive,
                  ]}
                  onPress={() => setTipoEntidad("natural")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.entityToggleText,
                      tipoEntidad === "natural" &&
                        styles.entityToggleActiveText,
                    ]}
                  >
                    Persona Natural
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.entityToggleBtn,
                    tipoEntidad === "empresa" && styles.entityToggleActive,
                  ]}
                  onPress={() => setTipoEntidad("empresa")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.entityToggleText,
                      tipoEntidad === "empresa" &&
                        styles.entityToggleActiveText,
                    ]}
                  >
                    Empresa (B2B)
                  </Text>
                </TouchableOpacity>
              </View>

              {tipoEntidad === "empresa" && (
                <View
                  style={{
                    backgroundColor: "#e0e7ff",
                    padding: 10,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#c7d2fe",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="gift-outline"
                    size={20}
                    color="#4f46e5"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#3730a3",
                      flex: 1,
                      lineHeight: 15,
                      fontWeight: "600",
                    }}
                  >
                     ¡Promoción Nuevas Empresas! Obtén{" "}
                    <Text style={{ fontWeight: "bold", color: "#4f46e5" }}>
                      3 MESES GRATIS
                    </Text>{" "}
                    de solicitudes B2B ilimitadas sin costo alguno.
                  </Text>
                </View>
              )}

              {/* Nombre / Razón Social */}
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "nombreRegistro" &&
                    (tipoEntidad === "empresa"
                      ? styles.inputContainerFocusedB2B
                      : styles.inputContainerFocused),
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={
                    focusedInput === "nombreRegistro"
                      ? tipoEntidad === "empresa"
                        ? "#6366f1"
                        : "#cca000"
                      : "#888"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={
                    tipoEntidad === "empresa"
                      ? "Razón Social / Nombre Empresa"
                      : "Nombre Completo"
                  }
                  placeholderTextColor="#999"
                  value={nombreRegistro}
                  onChangeText={setNombreRegistro}
                  editable={!cargando}
                  onFocus={() => setFocusedInput("nombreRegistro")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Celular con Selector de Código de País */}
              <Text style={styles.inputLabel}>Número de Celular:</Text>
              <View style={styles.phoneRowContainer}>
                <TouchableOpacity
                  style={[
                    styles.countryDropdownBtn,
                    tipoEntidad === "empresa"
                      ? styles.borderB2B
                      : styles.borderNormal,
                  ]}
                  onPress={() => setMostrarPaises(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryDropdownText}>
                    {PAISES_LATINOS.find((p) => p.codigo === codigoPais)
                      ?.bandera || "🇧🇴"}{" "}
                    +{codigoPais}
                  </Text>
                  <Ionicons
                    name="chevron-down-outline"
                    size={14}
                    color="#666"
                    style={{ marginLeft: 2 }}
                  />
                </TouchableOpacity>

                <View
                  style={[
                    styles.phoneInputContainer,
                    focusedInput === "celularRegistro" &&
                      (tipoEntidad === "empresa"
                        ? styles.inputContainerFocusedB2B
                        : styles.inputContainerFocused),
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={
                      focusedInput === "celularRegistro"
                        ? tipoEntidad === "empresa"
                          ? "#6366f1"
                          : "#cca000"
                        : "#888"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de celular"
                    placeholderTextColor="#999"
                    value={celular}
                    onChangeText={setCelular}
                    keyboardType="numeric"
                    editable={!cargando}
                    onFocus={() => setFocusedInput("celularRegistro")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Correo Electrónico (Obligatorio) */}
              <Text style={styles.inputLabel}>
                Correo electrónico (obligatorio):
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "correoRegistro" &&
                    (tipoEntidad === "empresa"
                      ? styles.inputContainerFocusedB2B
                      : styles.inputContainerFocused),
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={
                    focusedInput === "correoRegistro"
                      ? tipoEntidad === "empresa"
                        ? "#6366f1"
                        : "#cca000"
                      : "#888"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#999"
                  value={correoRegistro}
                  onChangeText={setCorreoRegistro}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!cargando}
                  onFocus={() => setFocusedInput("correoRegistro")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Contraseña */}
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "contrasenaRegistro" &&
                    (tipoEntidad === "empresa"
                      ? styles.inputContainerFocusedB2B
                      : styles.inputContainerFocused),
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    focusedInput === "contrasenaRegistro"
                      ? tipoEntidad === "empresa"
                        ? "#6366f1"
                        : "#cca000"
                      : "#888"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={contrasenaRegistro}
                  onChangeText={setContrasenaRegistro}
                  secureTextEntry={!mostrarContrasenaRegistro}
                  autoCapitalize="none"
                  editable={!cargando}
                  onFocus={() => setFocusedInput("contrasenaRegistro")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasenaRegistro(!mostrarContrasenaRegistro)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={mostrarContrasenaRegistro ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              {/* CAMPOS ADICIONALES PARA EMPRESA */}
              {tipoEntidad === "empresa" && (
                <View>
                  {/* NIT */}
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "nit" && styles.inputContainerFocusedB2B,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={focusedInput === "nit" ? "#6366f1" : "#888"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="NIT de la Empresa (Ej. 481920028)"
                      placeholderTextColor="#999"
                      value={nit}
                      onChangeText={setNit}
                      keyboardType="numeric"
                      editable={!cargando}
                      onFocus={() => setFocusedInput("nit")}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>

                  {/* Correo Facturación */}
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "correoFacturacion" &&
                        styles.inputContainerFocusedB2B,
                    ]}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color={
                        focusedInput === "correoFacturacion"
                          ? "#6366f1"
                          : "#888"
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Correo Facturación Electrónica"
                      placeholderTextColor="#999"
                      value={correoFacturacion}
                      onChangeText={setCorreoFacturacion}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!cargando}
                      onFocus={() => setFocusedInput("correoFacturacion")}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>

                  {/* Rubro */}
                  <Text style={styles.inputLabel}>Rubro Comercial:</Text>
                  <View style={styles.rubroContainer}>
                    {[
                      "Papelería",
                      "Decoración",
                      "Branding & Lettering",
                      "Servicios Generales",
                    ].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.rubroChip,
                          rubro === r && styles.rubroChipActive,
                        ]}
                        onPress={() => setRubro(r)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.rubroChipText,
                            rubro === r && styles.rubroChipActiveText,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Casilla Obligatoria de Aceptación de Términos (Únicamente al registrar nuevo usuario) */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 14,
                  marginBottom: 10,
                  paddingHorizontal: 4,
                }}
                onPress={() => setAceptaTerminos(!aceptaTerminos)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={aceptaTerminos ? "checkbox" : "square-outline"}
                  size={22}
                  color={aceptaTerminos ? "#FFB400" : "#888"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 12, color: "#475569", flex: 1, lineHeight: 18 }}>
                  Acepto los{" "}
                  <Text
                    style={{ color: "#3b82f6", textDecorationLine: "underline", fontWeight: "600" }}
                    onPress={(e: any) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      setTermsTab("terms");
                      setMostrarLegalModal(true);
                    }}
                  >
                    Términos de Servicio
                  </Text>{" "}
                  y la{" "}
                  <Text
                    style={{ color: "#3b82f6", textDecorationLine: "underline", fontWeight: "600" }}
                    onPress={(e: any) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      setTermsTab("privacy");
                      setMostrarLegalModal(true);
                    }}
                  >
                    Política de Privacidad
                  </Text>
                  .
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // FORMULARIO DE INICIO DE SESIÓN MANUAL
            <View>
              {/* Campo Celular / Correo */}
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "correoOTelefono" &&
                    styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={
                    focusedInput === "correoOTelefono" ? "#cca000" : "#888"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Celular o correo electrónico"
                  placeholderTextColor="#999"
                  value={correoOTelefono}
                  onChangeText={setCorreoOTelefono}
                  autoCapitalize="none"
                  keyboardType="default"
                  editable={!cargando}
                  onFocus={() => setFocusedInput("correoOTelefono")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Campo Contraseña */}
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === "contrasena" && styles.inputContainerFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedInput === "contrasena" ? "#cca000" : "#888"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry={!mostrarContrasena}
                  autoCapitalize="none"
                  editable={!cargando}
                  onFocus={() => setFocusedInput("contrasena")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={mostrarContrasena ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Botón o Cargando */}
          {cargando ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#FFB400" />
              <Text style={styles.loadingText}>Procesando solicitud...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={esRegistro ? manejarRegistroManual : manejarLoginNormal}
              activeOpacity={0.7}
            >
              <Text style={styles.loginBtnText}>
                {esRegistro ? "Registrarse" : "Ingresar"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#2F2F2F" />
            </TouchableOpacity>
          )}

          {/* Toggle entre Login y Registro */}
          <TouchableOpacity
            style={styles.toggleRegisterBtn}
            onPress={() => setEsRegistro(!esRegistro)}
            disabled={cargando}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleRegisterText}>
              {esRegistro
                ? "¿Ya tienes una cuenta? Inicia Sesión"
                : "¿No tienes cuenta? Regístrate aquí"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accesos Rápidos de Prueba (Con inicio de sesión automático y disabled al cargar) */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>
           Acceso rápido de prueba (Entrar al instante):
          </Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => manejarAccesoRapido("luis@todoya.com")}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Cliente (Luis)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => manejarAccesoRapido("juan.rios@todoya.com")}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Proveedor (Juan)</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => manejarAccesoRapido("empresa@todoya.com")}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Empresa (Alfa)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() =>
                manejarAccesoRapido("proveedor_empresa@todoya.com")
              }
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Empresa PRO (Beta)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simulaciones Guiadas de Casos Reales */}
        <View
          style={[
            styles.demoCard,
            { borderColor: "#818cf8", borderWidth: 1, marginTop: 15 },
          ]}
        >
          <Text
            style={[styles.demoTitle, { color: "#6366f1", fontWeight: "bold" }]}
          >
           🤖 Simulaciones Guiadas (Casos Reales):
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: "#666",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Simula paso a paso flujos completos para clientes o proveedores.
          </Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[
                styles.demoBtn,
                { backgroundColor: "#fffbeb", borderColor: "#d97706" },
              ]}
              onPress={() => {
                setCargando(true);
                startClientSimulation().finally(() => setCargando(false));
              }}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.demoBtnText,
                  { color: "#d97706", fontWeight: "bold" },
                ]}
              >
                Simular Cliente 🏠
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.demoBtn,
                { backgroundColor: "#e0e7ff", borderColor: "#4f46e5" },
              ]}
              onPress={() => {
                setCargando(true);
                startProviderSimulation().finally(() => setCargando(false));
              }}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.demoBtnText,
                  { color: "#4f46e5", fontWeight: "bold" },
                ]}
              >
                Simular Proveedor 🛠️
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divisor Visual de Redes Sociales */}
        <Text style={styles.socialDivider}>O CONECTAR CON</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => iniciarOauth("google")}
          >
            <Ionicons name="logo-google" size={18} color="#ea4335" />
            <Text style={styles.socialBtnText}>Google / Gmail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, { borderColor: "#0077b5" }]}
            onPress={() => iniciarOauth("linkedin")}
          >
            <Ionicons name="logo-linkedin" size={18} color="#0077b5" />
            <Text style={[styles.socialBtnText, { color: "#0077b5" }]}>
              LinkedIn
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal KYC — Verificación de Identidad para Proveedores */}
      <KYCVerifierModal
        visible={mostrarKYC}
        onClose={() => setMostrarKYC(false)}
        onVerified={(detalles) => completarRegistroConKYC(detalles)}
      />

      {/* Modal de Términos, Privacidad y Cumplimiento Legal (App Store 5.1.1) */}
      <TermsPrivacyModal
        visible={mostrarLegalModal}
        onClose={() => setMostrarLegalModal(false)}
        initialTab={termsTab}
      />

      {/* MODAL DE ERROR/ALERTA PERSONALIZADO */}
      {mostrarModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{configuracionModal.titulo}</Text>
            <Text style={styles.modalMessage}>
              {configuracionModal.mensaje}
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setMostrarModal(false)}
            >
              <Text style={styles.modalConfirmText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BANNER SIMULACIÓN SMS PIN */}
      {smsToastText && (
        <View style={styles.smsToast}>
          <View style={styles.smsToastIcon}>
            <Ionicons name="chatbubble-ellipses" size={22} color="#1a1a1a" />
          </View>
          <View style={styles.smsToastContent}>
            <Text style={styles.smsToastTitle}> Mensaje SMS Nuevo</Text>
            <Text style={styles.smsToastMessage}>{smsToastText}</Text>
          </View>
          <TouchableOpacity
            style={styles.smsToastClose}
            onPress={() => setSmsToastText(null)}
          >
            <Ionicons name="close" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL SELECCIONAR PAIS */}
      <Modal
        visible={mostrarPaises}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarPaises(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { maxHeight: "70%", paddingBottom: 20 },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#2F2F2F" }}
              >
                Elegir Código de País
              </Text>
              <TouchableOpacity
                onPress={() => setMostrarPaises(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.paisesList}>
              {PAISES_LATINOS.map((pais) => (
                <TouchableOpacity
                  key={pais.nombre}
                  style={styles.paisItem}
                  onPress={() => {
                    setCodigoPais(pais.codigo);
                    setMostrarPaises(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.paisBandera}>{pais.bandera}</Text>
                  <Text style={styles.paisNombre}>{pais.nombre}</Text>
                  <Text style={styles.paisCodigo}>+{pais.codigo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL VERIFICACIÓN DOBLE FACTOR PIN */}
      <Modal
        visible={mostrarModalPIN}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalPIN(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360 }]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={48}
              color="#FFB400"
              style={{ alignSelf: "center", marginBottom: 12 }}
            />
            <Text
              style={[styles.modalTitle, { textAlign: "center", fontSize: 18 }]}
            >
              Verificación del Teléfono
            </Text>
            <Text
              style={[
                styles.modalMessage,
                { textAlign: "center", color: "#64748b" },
              ]}
            >
              Por favor, introduce el código de 4 dígitos enviado por SMS a:
              {"\n"}
              <Text style={{ fontWeight: "700", color: "#1e293b" }}>
                +{codigoPais} {celular}
              </Text>
            </Text>

            {/* Input PIN */}
            <View style={styles.pinContainer}>
              {[0, 1, 2, 3].map((idx) => {
                const char = pinIngresado[idx] || "";
                return (
                  <TextInput
                    key={idx}
                    style={[
                      styles.pinInputBox,
                      pinIngresado.length === idx && styles.pinInputBoxFocused,
                    ]}
                    maxLength={1}
                    keyboardType="numeric"
                    value={char}
                    onChangeText={(val) => {
                      if (val) {
                        const newPin = pinIngresado + val;
                        setPinIngresado(newPin.slice(0, 4));
                        setPinError("");
                      } else {
                        setPinIngresado(pinIngresado.slice(0, -1));
                      }
                    }}
                    editable={!cargando}
                    selectTextOnFocus
                  />
                );
              })}
            </View>

            {pinError ? (
              <Text
                style={{
                  color: "#ef4444",
                  textAlign: "center",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {pinError}
              </Text>
            ) : null}

            <Text style={styles.countdownText}>
              {smsCountdown > 0
                ? `El código expira en ${smsCountdown}s`
                : "El código ha expirado"}
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmarPinYRegistrar}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Verificar y Activar</Text>
              </TouchableOpacity>

              {/* Botón de Enviar Código a WhatsApp */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#25D366",
                  paddingVertical: 10,
                  borderRadius: 10,
                  gap: 8,
                }}
                onPress={() => enviarSmsPin("whatsapp")}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                  Enviar a mi WhatsApp
                </Text>
              </TouchableOpacity>

              {/* Botón de Enviar por SMS Nativo */}
              <TouchableOpacity
                style={[
                  styles.resendBtn,
                  { flexDirection: "row", justifyContent: "center", gap: 6 },
                ]}
                onPress={() => enviarSmsPin("sms")}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#475569" />
                <Text style={styles.resendText}>Enviar por SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 8, alignItems: "center" }}
                onPress={() => setMostrarModalPIN(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={{ color: "#64748b", fontSize: 13, fontWeight: "500" }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP SIMULACIÓN OAUTH FLOTANTE (Google / LinkedIn) */}
      {proveedorOauth && (
        <View style={styles.oauthOverlay}>
          <View style={styles.oauthWindow}>
            {/* Cabecera de ventana de navegador simulada */}
            <View style={styles.oauthBrowserHeader}>
              <View style={styles.browserDots}>
                <View style={[styles.dot, { backgroundColor: "#ff5f56" }]} />
                <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
                <View style={[styles.dot, { backgroundColor: "#27c93f" }]} />
              </View>
              <Text style={styles.browserUrl}>
                {proveedorOauth === "google"
                  ? "accounts.google.com/oauth"
                  : "linkedin.com/uas/oauth2"}
              </Text>
              <TouchableOpacity
                style={styles.browserClose}
                onPress={() => setProveedorOauth(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.oauthScrollContent}>
              {/* PASO 1: Elegir cuenta / Autorizar */}
              {pasoOauth === "login" && (
                <View>
                  {proveedorOauth === "google" ? (
                    <View style={styles.oauthStepContainer}>
                      <Ionicons
                        name="logo-google"
                        size={48}
                        color="#ea4335"
                        style={{ alignSelf: "center", marginBottom: 12 }}
                      />
                      <Text style={styles.oauthTitle}>
                        Escribe o elige tu cuenta
                      </Text>
                      <Text style={styles.oauthSubtitle}>
                        para continuar a{" "}
                        <Text style={{ fontWeight: "bold" }}>Todo Ya</Text>
                      </Text>

                      <View style={styles.oauthAccountsList}>
                        <TouchableOpacity
                          style={styles.oauthAccountItem}
                          onPress={() =>
                            manejarSeleccionCorreoOauth("luis.m@gmail.com")
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.oauthAccountAvatar}>
                            <Text style={styles.oauthAvatarText}>LM</Text>
                          </View>
                          <View>
                            <Text style={styles.oauthAccountName}>
                              Luis Alberto M.
                            </Text>
                            <Text style={styles.oauthAccountEmail}>
                              luis.m@gmail.com
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.oauthAccountItem}
                          onPress={() =>
                            manejarSeleccionCorreoOauth("juan.rios@gmail.com")
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.oauthAccountAvatar}>
                            <Text style={styles.oauthAvatarText}>JR</Text>
                          </View>
                          <View>
                            <Text style={styles.oauthAccountName}>
                              Juan Ríos
                            </Text>
                            <Text style={styles.oauthAccountEmail}>
                              juan.rios@gmail.com
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {!mostrarEntradaCorreoPersonalizado ? (
                          <TouchableOpacity
                            style={[
                              styles.oauthAccountItem,
                              {
                                justifyContent: "center",
                                backgroundColor: "#f9f9f9",
                                borderStyle: "dashed",
                              },
                            ]}
                            onPress={() =>
                              setMostrarEntradaCorreoPersonalizado(true)
                            }
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color="#666"
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#666",
                                fontWeight: "500",
                              }}
                            >
                              Usar otra cuenta de Gmail
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.oauthCustomEmailBox}>
                            <TextInput
                              style={[
                                styles.oauthInput,
                                focusedInput === "correoOauthPersonalizado" &&
                                  styles.oauthInputFocused,
                              ]}
                              placeholder="ejemplo@gmail.com"
                              value={correoOauthPersonalizado}
                              onChangeText={setCorreoOauthPersonalizado}
                              autoCapitalize="none"
                              keyboardType="email-address"
                              onFocus={() =>
                                setFocusedInput("correoOauthPersonalizado")
                              }
                              onBlur={() => setFocusedInput(null)}
                            />
                            <View
                              style={{
                                flexDirection: "row",
                                gap: 10,
                                marginTop: 10,
                              }}
                            >
                              <TouchableOpacity
                                style={[styles.oauthBtnSecondary, { flex: 1 }]}
                                onPress={() =>
                                  setMostrarEntradaCorreoPersonalizado(false)
                                }
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={{
                                    color: "#2F2F2F",
                                    fontWeight: "600",
                                  }}
                                >
                                  Atrás
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.oauthBtnPrimary,
                                  { flex: 2, backgroundColor: "#ea4335" },
                                ]}
                                onPress={manejarEnvioCorreoPersonalizado}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={{ color: "white", fontWeight: "600" }}
                                >
                                  Continuar
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    // LinkedIn Auth Flow
                    <View style={styles.oauthStepContainer}>
                      <Ionicons
                        name="logo-linkedin"
                        size={48}
                        color="#0077b5"
                        style={{ alignSelf: "center", marginBottom: 12 }}
                      />
                      <Text style={styles.oauthTitle}>
                        Registrarse con LinkedIn
                      </Text>
                      <Text style={styles.oauthSubtitle}>
                        Sincroniza tus datos profesionales con Todo Ya
                      </Text>

                      <View style={styles.oauthPermissionsCard}>
                        <Text style={styles.oauthPermissionsTitle}>
                          Permisos solicitados:
                        </Text>
                        <View style={styles.permissionRow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4caf50"
                          />
                          <Text style={styles.permissionText}>
                            Nombre completo e iniciales de perfil
                          </Text>
                        </View>
                        <View style={styles.permissionRow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4caf50"
                          />
                          <Text style={styles.permissionText}>
                            Dirección de correo electrónico asociada
                          </Text>
                        </View>
                      </View>

                      <View style={{ gap: 12, width: "100%", marginTop: 16 }}>
                        <TouchableOpacity
                          style={styles.oauthAccountItem}
                          onPress={() =>
                            manejarAutenticacionLinkedIn(
                              "mario.linkedin@todoya.com",
                              "Mario Céspedes",
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.oauthAccountAvatar,
                              { backgroundColor: "#0077b5" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.oauthAvatarText,
                                { color: "white" },
                              ]}
                            >
                              MC
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.oauthAccountName}>
                              Mario Céspedes
                            </Text>
                            <Text style={styles.oauthAccountEmail}>
                              Sincronizar cuenta profesional
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.oauthAccountItem}
                          onPress={() =>
                            manejarAutenticacionLinkedIn(
                              "gloria.valdez@linkedin.com",
                              "Gloria Valdez",
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.oauthAccountAvatar,
                              { backgroundColor: "#0077b5" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.oauthAvatarText,
                                { color: "white" },
                              ]}
                            >
                              GV
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.oauthAccountName}>
                              Gloria Valdez
                            </Text>
                            <Text style={styles.oauthAccountEmail}>
                              Sincronizar cuenta profesional
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* PASO 2: Cargando/Sincronizando */}
              {pasoOauth === "loading" && (
                <View style={styles.oauthLoadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={proveedorOauth === "google" ? "#ea4335" : "#0077b5"}
                  />
                  <Text style={styles.oauthLoadingText}>
                    {proveedorOauth === "google"
                      ? "Sincronizando con Google Account..."
                      : "Cargando perfil profesional de LinkedIn..."}
                  </Text>
                </View>
              )}

              {/* PASO 3: Registro (Si es usuario nuevo, se le pregunta el Rol) */}
              {pasoOauth === "register" && (
                <View style={styles.oauthStepContainer}>
                  <Text style={styles.registerTitle}>
                   ¡Bienvenido a Todo Ya!
                  </Text>
                  <Text style={styles.registerSubtitle}>
                    Sincronizamos tu cuenta ({correoOauth}). Por favor completa
                    tu perfil:
                  </Text>

                  {/* Campo de Nombre */}
                  <Text style={styles.inputLabel}>Tu Nombre Completo:</Text>
                  <TextInput
                    style={[
                      styles.oauthInput,
                      focusedInput === "nombreOauth" &&
                        styles.oauthInputFocused,
                    ]}
                    value={nombreOauth}
                    onChangeText={setNombreOauth}
                    placeholder="Tu nombre"
                    onFocus={() => setFocusedInput("nombreOauth")}
                    onBlur={() => setFocusedInput(null)}
                  />

                  <Text style={styles.registerSubtitle}>
                    Tu cuenta se registrará por defecto con el rol de Cliente.
                    Podrás cambiar a perfil de Proveedor en cualquier momento
                    desde tu menú de perfil.
                  </Text>

                  {/* Botón Finalizar */}
                  <TouchableOpacity
                    style={[
                      styles.oauthBtnSubmit,
                      {
                        backgroundColor:
                          proveedorOauth === "google" ? "#ea4335" : "#0077b5",
                      },
                    ]}
                    onPress={manejarRegistroCompleto}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.oauthBtnSubmitText}>
                      Finalizar y registrarse
                    </Text>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    paddingVertical: Platform.OS === "web" ? 40 : 24,
    paddingHorizontal: 24,
  },
  topCircle: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  bottomCircle: {
    position: "absolute",
    bottom: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(47, 47, 47, 0.05)",
  },
  content: {
    zIndex: 10,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: 100,
    height: 125,
    borderRadius: 20,
    marginBottom: 8,
  },
  logoIconBg: {
    width: 80,
    height: 80,
    backgroundColor: "#FFB400",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#FFB400",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2F2F2F",
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2F2F2F",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: "#FFB400",
    backgroundColor: "#fff",
    shadowColor: "#FFB400",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerFocusedB2B: {
    borderColor: "#6366f1",
    backgroundColor: "#fff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#2F2F2F",
    fontSize: 15,
    outlineStyle: "none",
    height: "100%",
    paddingVertical: 0,
  } as any,
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB400",
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 8,
    shadowColor: "#FFB400",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginBtnText: {
    color: "#2F2F2F",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  demoCard: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5a4800",
    marginBottom: 8,
  },
  legalNoticeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 8,
    flexWrap: "wrap",
  },
  legalNoticeText: {
    fontSize: 11,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 16,
  },
  legalNoticeLink: {
    color: "#3b82f6",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  demoButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtnText: {
    fontSize: 12,
    color: "#5a4800",
    fontWeight: "600",
  },
  socialDivider: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginVertical: 24,
  },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  socialBtnText: {
    fontSize: 14,
    color: "#2F2F2F",
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    borderWidth: 2,
    borderColor: "#FFB400",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2F2F2F",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalConfirmBtn: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#FFB400",
  },
  modalConfirmText: {
    color: "#2F2F2F",
    fontSize: 14,
    fontWeight: "700",
  },

  // Estilos de la simulación de OAuth
  oauthOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    padding: 16,
  },
  oauthWindow: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  oauthBrowserHeader: {
    height: 44,
    backgroundColor: "#f1f1f1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e2e2e2",
  },
  browserDots: {
    flexDirection: "row",
    gap: 6,
    width: 60,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  browserUrl: {
    flex: 1,
    textAlign: "center",
    color: "#777",
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingVertical: 4,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },
  browserClose: {
    padding: 4,
  },
  oauthScrollContent: {
    padding: 24,
  },
  oauthStepContainer: {
    width: "100%",
  },
  oauthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2F2F2F",
    textAlign: "center",
    marginBottom: 4,
  },
  oauthSubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  oauthAccountsList: {
    gap: 12,
  },
  oauthAccountItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    gap: 16,
  },
  oauthAccountAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFB400",
    alignItems: "center",
    justifyContent: "center",
  },
  oauthAvatarText: {
    fontWeight: "700",
    color: "#2F2F2F",
    fontSize: 14,
  },
  oauthAccountName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2F2F2F",
  },
  oauthAccountEmail: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  oauthCustomEmailBox: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  oauthInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: "#2F2F2F",
    outlineStyle: "none",
    width: "100%",
    marginBottom: 10,
  } as any,
  oauthInputFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#fff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  oauthBtnPrimary: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  oauthBtnSecondary: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  oauthPermissionsCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  oauthPermissionsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 10,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  permissionText: {
    fontSize: 12,
    color: "#475569",
  },
  oauthLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  oauthLoadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  registerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2F2F2F",
    textAlign: "center",
    marginBottom: 6,
  },
  registerSubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 12,
  },
  rolesContainer: {
    flexDirection: "column",
    gap: 12,
    marginVertical: 10,
  },
  roleCard: {
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "#e8e8e8",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  roleCardActiveClient: {
    borderColor: "#FFB400",
    backgroundColor: "#fffbeb",
  },
  roleCardActiveProvider: {
    borderColor: "#FFB400",
    backgroundColor: "#f1f1f1",
  },
  roleCardActiveBusiness: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2F6",
  },
  roleTextActiveBusiness: {
    color: "#3730A3",
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2F2F2F",
    marginTop: 4,
  },
  roleTextActive: {
    color: "#5a4800",
  },
  roleTextActiveDark: {
    color: "#2F2F2F",
  },
  roleCardDesc: {
    fontSize: 12,
    color: "#666",
  },
  roleTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  oauthBtnSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  oauthBtnSubmitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  toggleRegisterBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  toggleRegisterText: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "600",
  },
  entityToggleContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  entityToggleBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  entityToggleActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  entityToggleText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  entityToggleActiveText: {
    color: "#fff",
  },
  rubroContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  rubroChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 20,
    backgroundColor: "#f9f9f9",
  },
  rubroChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  rubroChipText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  rubroChipActiveText: {
    color: "#fff",
    fontWeight: "600",
  },
  purposeToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  purposeBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  purposeActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  purposeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  purposeActiveText: {
    color: "#fff",
    fontWeight: "600",
  },
  phoneRowContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    height: 54,
  },
  countryDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#f9f9f9",
    width: "32%",
    height: 54,
  },
  countryDropdownText: {
    fontSize: 13,
    color: "#2f2f2f",
    fontWeight: "600",
  },
  borderNormal: {
    borderColor: "#eee",
  },
  borderB2B: {
    borderColor: "#eee",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    paddingHorizontal: 12,
    width: "65%",
    height: 54,
  },
  // Modal Paises Styles
  paisesList: {
    paddingVertical: 10,
  },
  paisItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  paisBandera: {
    fontSize: 22,
    marginRight: 12,
  },
  paisNombre: {
    fontSize: 15,
    color: "#1e293b",
    flex: 1,
    fontWeight: "500",
  },
  paisCodigo: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "600",
  },
  // Modal PIN Styles
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 24,
  },
  pinInputBox: {
    width: 50,
    height: 56,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  pinInputBoxFocused: {
    borderColor: "#FFB400",
    backgroundColor: "#fff",
  },
  countdownText: {
    textAlign: "center",
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  resendBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#FFB400",
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: "#cbd5e1",
  },
  smsToast: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  smsToastIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFB400",
    alignItems: "center",
    justifyContent: "center",
  },
  smsToastContent: {
    flex: 1,
  },
  smsToastTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  smsToastMessage: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2,
  },
  smsToastClose: {
    padding: 4,
  },
});
