import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useUser, UserRole } from '../context/user-context';
import { router } from 'expo-router'; // Importar enrutador para redireccionar tras login dinámico

/**
 * Componente LoginScreen:
 * Interfaz de inicio de sesión premium y lógica de autenticación/registro social simulado.
 * Todos los métodos, variables y parámetros nuevos están en español para su fácil lectura y modificación.
 */
export default function LoginScreen() {
  const { login, usuariosRegistrados, registrarEIniciarSesion, registrarUsuario } = useUser();
  const [correoOTelefono, setCorreoOTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false); // Spinner de carga al enviar

  // Estados del Registro Manual
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombreRegistro, setNombreRegistro] = useState('');
  const [correoOTelefonoRegistro, setCorreoOTelefonoRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');
  const [tipoEntidad, setTipoEntidad] = useState<'natural' | 'empresa'>('natural');
  const [nit, setNit] = useState('');
  const [correoFacturacion, setCorreoFacturacion] = useState('');
  const [rubro, setRubro] = useState('Papelería');
  const [b2bRol, setB2bRol] = useState<'client' | 'provider'>('client');
  const [naturalRol, setNaturalRol] = useState<'client' | 'provider'>('client');

  // Configuración del modal de error/éxito personalizado
  const [mostrarModal, setMostrarModal] = useState(false);
  const [configuracionModal, setConfiguracionModal] = useState({ titulo: '', mensaje: '' });

  // Estados de la simulación de OAuth Social (Google / LinkedIn) en español
  const [proveedorOauth, setProveedorOauth] = useState<'google' | 'linkedin' | null>(null);
  const [pasoOauth, setPasoOauth] = useState<'login' | 'register' | 'loading' | null>(null);
  const [correoOauth, setCorreoOauth] = useState('');
  const [nombreOauth, setNombreOauth] = useState('');
  const [rolOauth, setRolOauth] = useState<UserRole>('client');
  const [correoOauthPersonalizado, setCorreoOauthPersonalizado] = useState('');
  const [mostrarEntradaCorreoPersonalizado, setMostrarEntradaCorreoPersonalizado] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  /**
   * Registra manualmente un nuevo usuario en la app.
   */
  const manejarRegistroManual = async () => {
    if (!nombreRegistro.trim()) {
      setConfiguracionModal({
        titulo: '⚠️ Nombre vacío',
        mensaje: 'Por favor ingresa tu nombre o razón social.'
      });
      setMostrarModal(true);
      return;
    }
    if (!correoOTelefonoRegistro.trim()) {
      setConfiguracionModal({
        titulo: '⚠️ Correo o Teléfono vacío',
        mensaje: 'Por favor ingresa tu número de teléfono o correo electrónico para registrarte.'
      });
      setMostrarModal(true);
      return;
    }
    if (!contrasenaRegistro.trim() || contrasenaRegistro.length < 4) {
      setConfiguracionModal({
        titulo: '⚠️ Contraseña inválida',
        mensaje: 'La contraseña debe tener al menos 4 caracteres.'
      });
      setMostrarModal(true);
      return;
    }

    if (tipoEntidad === 'empresa') {
      if (!nit.trim()) {
        setConfiguracionModal({
          titulo: '⚠️ NIT vacío',
          mensaje: 'Por favor ingresa el NIT de la empresa.'
        });
        setMostrarModal(true);
        return;
      }
      if (!correoFacturacion.trim()) {
        setConfiguracionModal({
          titulo: '⚠️ Correo de facturación vacío',
          mensaje: 'Por favor ingresa tu correo de facturación electrónica.'
        });
        setMostrarModal(true);
        return;
      }
    }

    setCargando(true);
    setTimeout(async () => {
      const finalRole: UserRole = tipoEntidad === 'empresa' ? 'business' : 'client';

      const exito = await registrarUsuario(
        nombreRegistro.trim(),
        correoOTelefonoRegistro.trim(),
        finalRole,
        contrasenaRegistro,
        tipoEntidad,
        tipoEntidad === 'empresa' ? nit.trim() : undefined,
        tipoEntidad === 'empresa' ? correoFacturacion.trim() : undefined,
        tipoEntidad === 'empresa' ? rubro : undefined,
        // CORRECCIÓN: Si es una entidad de tipo empresa, se establece ofreceB2B como true por defecto
        tipoEntidad === 'empresa'
      );

      setCargando(false);
      if (exito) {
        setConfiguracionModal({
          titulo: '🎉 ¡Registro Exitoso!',
          mensaje: 'Tu cuenta ha sido creada correctamente. ¡Bienvenido a Todo Ya!'
        });
        setMostrarModal(true);
        setEsRegistro(false);
        setNombreRegistro('');
        setCorreoOTelefonoRegistro('');
        setContrasenaRegistro('');
        setNit('');
        setCorreoFacturacion('');
      } else {
        setConfiguracionModal({
          titulo: '❌ Error de Registro',
          mensaje: 'El correo o número de teléfono ingresado ya existe. Inténtalo con otro.'
        });
        setMostrarModal(true);
      }
    }, 1200);
  };

  /**
   * Intenta iniciar sesión con las credenciales normales introducidas.
   * Valida campos vacíos y simula un tiempo de respuesta de red antes de autenticar.
   */
  const manejarLoginNormal = async () => {
    // Validación de usuario/celular vacío
    if (!correoOTelefono.trim()) {
      setConfiguracionModal({
        titulo: '⚠️ Correo o Teléfono vacío',
        mensaje: 'Por favor ingresa tu número de teléfono o correo electrónico para continuar.'
      });
      setMostrarModal(true);
      return;
    }
    // Validación de contraseña vacía
    if (!contrasena.trim()) {
      setConfiguracionModal({
        titulo: '⚠️ Contraseña vacía',
        mensaje: 'Por favor ingresa tu contraseña.'
      });
      setMostrarModal(true);
      return;
    }

    setCargando(true);
    // Retraso artificial de 1.2 segundos para simular una consulta a base de datos externa
    setTimeout(async () => {
      const exito = await login(correoOTelefono, contrasena);
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
    setContrasena('demo1234');
    setCargando(true); // Activar indicador de carga para dar feedback visual
    
    // Determinar qué rol debe tener el usuario al loguearse mediante el botón de prueba de acceso rápido
    let forceRole: UserRole = 'client';
    if (usuarioDemo === 'empresa@todoya.com') {
      forceRole = 'business';
    } else if (usuarioDemo === 'juan.rios@todoya.com' || usuarioDemo === 'proveedor_empresa@todoya.com') {
      forceRole = 'provider';
    }
    
    // Retraso artificial mínimo de 400ms para simular la autenticación y dar feedback
    setTimeout(async () => {
      const exito = await login(usuarioDemo, 'demo1234', forceRole);
      setCargando(false); // Desactivar carga
      if (exito) {
        // Redireccionar inmediatamente según el rol forzado para evitar quedarse en pantallas incorrectas
        if (forceRole === 'provider') {
          router.replace('/leads');
        } else {
          router.replace('/');
        }
      } else {
        setConfiguracionModal({
          titulo: '❌ Error de Acceso Rápido',
          mensaje: 'No se pudo iniciar sesión automáticamente con la cuenta de prueba.'
        });
        setMostrarModal(true);
      }
    }, 400);
  };

  /**
   * Inicia el flujo de autenticación social flotante (OAuth)
   */
  const iniciarOauth = (proveedor: 'google' | 'linkedin') => {
    setProveedorOauth(proveedor);
    setPasoOauth('login');
    setCorreoOauth('');
    setNombreOauth('');
    setRolOauth('client');
    setCorreoOauthPersonalizado('');
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
    const partes = correoSeleccionado.split('@')[0];
    const nombreSugerido = partes
      .split('.')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
    setNombreOauth(nombreSugerido);

    setPasoOauth('loading');

    // Retraso para simular comunicación con el proveedor OAuth
    setTimeout(() => {
      const usuarioExiste = usuariosRegistrados.find(u => {
        // Búsqueda robusta para evitar errores de undefined con datos antiguos de localStorage
        const correoRegistrado = (u.correoOTelefono || (u as any).emailOrPhone || '').toLowerCase();
        return correoRegistrado === correoSeleccionado.toLowerCase();
      });
      
      if (usuarioExiste) {
        // Cuenta existente: Inicia sesión directamente respetando sus datos
        registrarEIniciarSesion(usuarioExiste.nombre, usuarioExiste.correoOTelefono, usuarioExiste.rol, proveedorOauth || 'google');
        setProveedorOauth(null);
        setPasoOauth(null);
      } else {
        // Cuenta nueva: Ir al paso de registro y selección de rol
        setPasoOauth('register');
      }
    }, 1500);
  };

  /**
   * Envía el correo ingresado manualmente en el flujo de Google
   */
  const manejarEnvioCorreoPersonalizado = () => {
    const correo = correoOauthPersonalizado.trim();
    if (!correo || !correo.includes('@')) {
      setConfiguracionModal({
        titulo: '⚠️ Correo inválido',
        mensaje: 'Por favor ingresa una dirección de correo electrónico válida.'
      });
      setMostrarModal(true);
      return;
    }
    manejarSeleccionCorreoOauth(correo);
  };

  /**
   * Maneja el flujo de autenticación de LinkedIn
   */
  const manejarAutenticacionLinkedIn = (correoLinkedIn: string, nombreLinkedIn: string) => {
    setCorreoOauth(correoLinkedIn);
    setNombreOauth(nombreLinkedIn);
    setPasoOauth('loading');

    setTimeout(() => {
      const usuarioExiste = usuariosRegistrados.find(u => {
        // Búsqueda robusta para evitar errores de undefined con datos antiguos de localStorage
        const correoRegistrado = (u.correoOTelefono || (u as any).emailOrPhone || '').toLowerCase();
        return correoRegistrado === correoLinkedIn.toLowerCase();
      });
      if (usuarioExiste) {
        registrarEIniciarSesion(usuarioExiste.nombre, usuarioExiste.correoOTelefono, usuarioExiste.rol, 'linkedin');
        setProveedorOauth(null);
        setPasoOauth(null);
      } else {
        setPasoOauth('register');
      }
    }, 1500);
  };

  /**
   * Ejecuta el registro final del usuario social ingresándolo a la app.
   */
  const manejarRegistroCompleto = () => {
    if (!nombreOauth.trim()) {
      setConfiguracionModal({
        titulo: '⚠️ Nombre vacío',
        mensaje: 'Por favor introduce tu nombre para completar el registro.'
      });
      setMostrarModal(true);
      return;
    }

    setPasoOauth('loading');

    setTimeout(async () => {
      await registrarEIniciarSesion(nombreOauth, correoOauth, rolOauth, proveedorOauth || 'google');
      
      setConfiguracionModal({
        titulo: '🎉 ¡Registro Exitoso!',
        mensaje: `Te has registrado correctamente con tu cuenta de ${proveedorOauth === 'google' ? 'Google' : 'LinkedIn'}. ¡Bienvenido a Todo Ya, ${nombreOauth}!`
      });
      setMostrarModal(true);

      setProveedorOauth(null);
      setPasoOauth(null);
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Círculos decorativos en el fondo con transparencias */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <View style={styles.content}>
        {/* Sección de Encabezado y Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.tagline}>Servicios locales en minutos</Text>
        </View>

        {/* Tarjeta de Formulario de Entrada */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>

          {esRegistro ? (
            // FORMULARIO DE REGISTRO MANUAL
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={true}>
              {/* Selector de Tipo de Entidad (Persona Natural vs Empresa) */}
              <Text style={styles.inputLabel}>¿Cómo te registras?</Text>
              <View style={styles.entityToggleContainer}>
                <TouchableOpacity 
                  style={[styles.entityToggleBtn, tipoEntidad === 'natural' && styles.entityToggleActive]}
                  onPress={() => setTipoEntidad('natural')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.entityToggleText, tipoEntidad === 'natural' && styles.entityToggleActiveText]}>Persona Natural</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.entityToggleBtn, tipoEntidad === 'empresa' && styles.entityToggleActive]}
                  onPress={() => setTipoEntidad('empresa')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.entityToggleText, tipoEntidad === 'empresa' && styles.entityToggleActiveText]}>Empresa (B2B)</Text>
                </TouchableOpacity>
              </View>

              {/* Nombre / Razón Social */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'nombreRegistro' && (tipoEntidad === 'empresa' ? styles.inputContainerFocusedB2B : styles.inputContainerFocused)
              ]}>
                <Ionicons name="person-outline" size={20} color={focusedInput === 'nombreRegistro' ? (tipoEntidad === 'empresa' ? '#6366f1' : '#cca000') : '#888'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={tipoEntidad === 'empresa' ? "Razón Social / Nombre Empresa" : "Nombre Completo"}
                  placeholderTextColor="#999"
                  value={nombreRegistro}
                  onChangeText={setNombreRegistro}
                  editable={!cargando}
                  onFocus={() => setFocusedInput('nombreRegistro')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Celular / Correo */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'correoOTelefonoRegistro' && (tipoEntidad === 'empresa' ? styles.inputContainerFocusedB2B : styles.inputContainerFocused)
              ]}>
                <Ionicons name="mail-outline" size={20} color={focusedInput === 'correoOTelefonoRegistro' ? (tipoEntidad === 'empresa' ? '#6366f1' : '#cca000') : '#888'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Celular o correo electrónico"
                  placeholderTextColor="#999"
                  value={correoOTelefonoRegistro}
                  onChangeText={setCorreoOTelefonoRegistro}
                  autoCapitalize="none"
                  editable={!cargando}
                  onFocus={() => setFocusedInput('correoOTelefonoRegistro')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Contraseña */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'contrasenaRegistro' && (tipoEntidad === 'empresa' ? styles.inputContainerFocusedB2B : styles.inputContainerFocused)
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'contrasenaRegistro' ? (tipoEntidad === 'empresa' ? '#6366f1' : '#cca000') : '#888'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={contrasenaRegistro}
                  onChangeText={setContrasenaRegistro}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!cargando}
                  onFocus={() => setFocusedInput('contrasenaRegistro')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* CAMPOS ADICIONALES PARA EMPRESA */}
              {tipoEntidad === 'empresa' && (
                <View>
                  {/* NIT */}
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'nit' && styles.inputContainerFocusedB2B
                  ]}>
                    <Ionicons name="document-text-outline" size={20} color={focusedInput === 'nit' ? '#6366f1' : '#888'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="NIT de la Empresa (Ej. 481920028)"
                      placeholderTextColor="#999"
                      value={nit}
                      onChangeText={setNit}
                      keyboardType="numeric"
                      editable={!cargando}
                      onFocus={() => setFocusedInput('nit')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>

                  {/* Correo Facturación */}
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'correoFacturacion' && styles.inputContainerFocusedB2B
                  ]}>
                    <Ionicons name="receipt-outline" size={20} color={focusedInput === 'correoFacturacion' ? '#6366f1' : '#888'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Correo Facturación Electrónica"
                      placeholderTextColor="#999"
                      value={correoFacturacion}
                      onChangeText={setCorreoFacturacion}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!cargando}
                      onFocus={() => setFocusedInput('correoFacturacion')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>

                  {/* Rubro */}
                  <Text style={styles.inputLabel}>Rubro Comercial:</Text>
                  <View style={styles.rubroContainer}>
                    {['Papelería', 'Decoración', 'Branding & Lettering', 'Servicios Generales'].map((r) => (
                      <TouchableOpacity 
                        key={r} 
                        style={[styles.rubroChip, rubro === r && styles.rubroChipActive]}
                        onPress={() => setRubro(r)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.rubroChipText, rubro === r && styles.rubroChipActiveText]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                </View>
              )}
            </ScrollView>
          ) : (
            // FORMULARIO DE INICIO DE SESIÓN MANUAL
            <View>
              {/* Campo Celular / Correo */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'correoOTelefono' && styles.inputContainerFocused
              ]}>
                <Ionicons name="mail-outline" size={20} color={focusedInput === 'correoOTelefono' ? '#cca000' : '#888'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Celular o correo electrónico"
                  placeholderTextColor="#999"
                  value={correoOTelefono}
                  onChangeText={setCorreoOTelefono}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!cargando}
                  onFocus={() => setFocusedInput('correoOTelefono')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Campo Contraseña */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'contrasena' && styles.inputContainerFocused
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'contrasena' ? '#cca000' : '#888'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!cargando}
                  onFocus={() => setFocusedInput('contrasena')}
                  onBlur={() => setFocusedInput(null)}
                />
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
              <Text style={styles.loginBtnText}>{esRegistro ? 'Registrarse' : 'Ingresar'}</Text>
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
              {esRegistro ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accesos Rápidos de Prueba (Con inicio de sesión automático y disabled al cargar) */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>💡 Acceso rápido de prueba (Entrar al instante):</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity 
              style={styles.demoBtn} 
              onPress={() => manejarAccesoRapido('luis@todoya.com')}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Cliente (Luis)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.demoBtn} 
              onPress={() => manejarAccesoRapido('juan.rios@todoya.com')}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Proveedor (Juan)</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.demoButtons, { marginTop: 10 }]}>
            <TouchableOpacity 
              style={styles.demoBtn} 
              onPress={() => manejarAccesoRapido('empresa@todoya.com')}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Empresa (Alfa)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.demoBtn} 
              onPress={() => manejarAccesoRapido('proveedor_empresa@todoya.com')}
              disabled={cargando}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Empresa PRO (Beta)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divisor Visual de Redes Sociales */}
        <Text style={styles.socialDivider}>O CONECTAR CON</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialBtn}
            onPress={() => iniciarOauth('google')}
          >
            <Ionicons name="logo-google" size={18} color="#ea4335" />
            <Text style={styles.socialBtnText}>Google / Gmail</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialBtn, { borderColor: '#0077b5' }]}
            onPress={() => iniciarOauth('linkedin')}
          >
            <Ionicons name="logo-linkedin" size={18} color="#0077b5" />
            <Text style={[styles.socialBtnText, { color: '#0077b5' }]}>LinkedIn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE ERROR/ALERTA PERSONALIZADO */}
      {mostrarModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{configuracionModal.titulo}</Text>
            <Text style={styles.modalMessage}>{configuracionModal.mensaje}</Text>
            <TouchableOpacity 
              style={styles.modalConfirmBtn}
              onPress={() => setMostrarModal(false)}
            >
              <Text style={styles.modalConfirmText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* POPUP SIMULACIÓN OAUTH FLOTANTE (Google / LinkedIn) */}
      {proveedorOauth && (
        <View style={styles.oauthOverlay}>
          <View style={styles.oauthWindow}>
            
            {/* Cabecera de ventana de navegador simulada */}
            <View style={styles.oauthBrowserHeader}>
              <View style={styles.browserDots}>
                <View style={[styles.dot, { backgroundColor: '#ff5f56' }]} />
                <View style={[styles.dot, { backgroundColor: '#ffbd2e' }]} />
                <View style={[styles.dot, { backgroundColor: '#27c93f' }]} />
              </View>
              <Text style={styles.browserUrl}>
                {proveedorOauth === 'google' 
                  ? 'accounts.google.com/oauth' 
                  : 'linkedin.com/uas/oauth2'}
              </Text>
              <TouchableOpacity style={styles.browserClose} onPress={() => setProveedorOauth(null)} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.oauthScrollContent}>
              {/* PASO 1: Elegir cuenta / Autorizar */}
              {pasoOauth === 'login' && (
                <View>
                  {proveedorOauth === 'google' ? (
                    <View style={styles.oauthStepContainer}>
                      <Ionicons name="logo-google" size={48} color="#ea4335" style={{ alignSelf: 'center', marginBottom: 12 }} />
                      <Text style={styles.oauthTitle}>Escribe o elige tu cuenta</Text>
                      <Text style={styles.oauthSubtitle}>para continuar a <Text style={{ fontWeight: 'bold' }}>Todo Ya</Text></Text>

                      <View style={styles.oauthAccountsList}>
                        <TouchableOpacity 
                          style={styles.oauthAccountItem}
                          onPress={() => manejarSeleccionCorreoOauth('luis.m@gmail.com')}
                          activeOpacity={0.7}
                        >
                          <View style={styles.oauthAccountAvatar}><Text style={styles.oauthAvatarText}>LM</Text></View>
                          <View>
                            <Text style={styles.oauthAccountName}>Luis Alberto M.</Text>
                            <Text style={styles.oauthAccountEmail}>luis.m@gmail.com</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.oauthAccountItem}
                          onPress={() => manejarSeleccionCorreoOauth('juan.rios@gmail.com')}
                          activeOpacity={0.7}
                        >
                          <View style={styles.oauthAccountAvatar}><Text style={styles.oauthAvatarText}>JR</Text></View>
                          <View>
                            <Text style={styles.oauthAccountName}>Juan Ríos</Text>
                            <Text style={styles.oauthAccountEmail}>juan.rios@gmail.com</Text>
                          </View>
                        </TouchableOpacity>

                        {!mostrarEntradaCorreoPersonalizado ? (
                          <TouchableOpacity 
                            style={[styles.oauthAccountItem, { justifyContent: 'center', backgroundColor: '#f9f9f9', borderStyle: 'dashed' }]}
                            onPress={() => setMostrarEntradaCorreoPersonalizado(true)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add-circle-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>Usar otra cuenta de Gmail</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.oauthCustomEmailBox}>
                            <TextInput
                              style={[styles.oauthInput, focusedInput === 'correoOauthPersonalizado' && styles.oauthInputFocused]}
                              placeholder="ejemplo@gmail.com"
                              value={correoOauthPersonalizado}
                              onChangeText={setCorreoOauthPersonalizado}
                              autoCapitalize="none"
                              keyboardType="email-address"
                              onFocus={() => setFocusedInput('correoOauthPersonalizado')}
                              onBlur={() => setFocusedInput(null)}
                            />
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                              <TouchableOpacity 
                                style={[styles.oauthBtnSecondary, { flex: 1 }]}
                                onPress={() => setMostrarEntradaCorreoPersonalizado(false)}
                                activeOpacity={0.7}
                              >
                                <Text style={{ color: '#2F2F2F', fontWeight: '600' }}>Atrás</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.oauthBtnPrimary, { flex: 2, backgroundColor: '#ea4335' }]}
                                onPress={manejarEnvioCorreoPersonalizado}
                                activeOpacity={0.7}
                              >
                                <Text style={{ color: 'white', fontWeight: '600' }}>Continuar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    // LinkedIn Auth Flow
                    <View style={styles.oauthStepContainer}>
                      <Ionicons name="logo-linkedin" size={48} color="#0077b5" style={{ alignSelf: 'center', marginBottom: 12 }} />
                      <Text style={styles.oauthTitle}>Registrarse con LinkedIn</Text>
                      <Text style={styles.oauthSubtitle}>Sincroniza tus datos profesionales con Todo Ya</Text>

                      <View style={styles.oauthPermissionsCard}>
                        <Text style={styles.oauthPermissionsTitle}>Permisos solicitados:</Text>
                        <View style={styles.permissionRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                          <Text style={styles.permissionText}>Nombre completo e iniciales de perfil</Text>
                        </View>
                        <View style={styles.permissionRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                          <Text style={styles.permissionText}>Dirección de correo electrónico asociada</Text>
                        </View>
                      </View>

                      <View style={{ gap: 12, width: '100%', marginTop: 16 }}>
                        <TouchableOpacity 
                          style={styles.oauthAccountItem}
                          onPress={() => manejarAutenticacionLinkedIn('mario.linkedin@todoya.com', 'Mario Céspedes')}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.oauthAccountAvatar, { backgroundColor: '#0077b5' }]}><Text style={[styles.oauthAvatarText, { color: 'white' }]}>MC</Text></View>
                          <View>
                            <Text style={styles.oauthAccountName}>Mario Céspedes</Text>
                            <Text style={styles.oauthAccountEmail}>Sincronizar cuenta profesional</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.oauthAccountItem}
                          onPress={() => manejarAutenticacionLinkedIn('gloria.valdez@linkedin.com', 'Gloria Valdez')}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.oauthAccountAvatar, { backgroundColor: '#0077b5' }]}><Text style={[styles.oauthAvatarText, { color: 'white' }]}>GV</Text></View>
                          <View>
                            <Text style={styles.oauthAccountName}>Gloria Valdez</Text>
                            <Text style={styles.oauthAccountEmail}>Sincronizar cuenta profesional</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* PASO 2: Cargando/Sincronizando */}
              {pasoOauth === 'loading' && (
                <View style={styles.oauthLoadingContainer}>
                  <ActivityIndicator size="large" color={proveedorOauth === 'google' ? '#ea4335' : '#0077b5'} />
                  <Text style={styles.oauthLoadingText}>
                    {proveedorOauth === 'google' 
                      ? 'Sincronizando con Google Account...' 
                      : 'Cargando perfil profesional de LinkedIn...'}
                  </Text>
                </View>
              )}

              {/* PASO 3: Registro (Si es usuario nuevo, se le pregunta el Rol) */}
              {pasoOauth === 'register' && (
                <View style={styles.oauthStepContainer}>
                  <Text style={styles.registerTitle}>👋 ¡Bienvenido a Todo Ya!</Text>
                  <Text style={styles.registerSubtitle}>Sincronizamos tu cuenta ({correoOauth}). Por favor completa tu perfil:</Text>

                  {/* Campo de Nombre */}
                  <Text style={styles.inputLabel}>Tu Nombre Completo:</Text>
                  <TextInput
                    style={[styles.oauthInput, focusedInput === 'nombreOauth' && styles.oauthInputFocused]}
                    value={nombreOauth}
                    onChangeText={setNombreOauth}
                    placeholder="Tu nombre"
                    onFocus={() => setFocusedInput('nombreOauth')}
                    onBlur={() => setFocusedInput(null)}
                  />

                  <Text style={styles.registerSubtitle}>
                    Tu cuenta se registrará por defecto con el rol de Cliente. Podrás cambiar a perfil de Proveedor en cualquier momento desde tu menú de perfil.
                  </Text>

                  {/* Botón Finalizar */}
                  <TouchableOpacity 
                    style={[
                      styles.oauthBtnSubmit, 
                      { backgroundColor: proveedorOauth === 'google' ? '#ea4335' : '#0077b5' }
                    ]}
                    onPress={manejarRegistroCompleto}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.oauthBtnSubmitText}>Finalizar y registrarse</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 24,
  },
  topCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(47, 47, 47, 0.05)',
  },
  content: {
    zIndex: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoImage: {
    width: 140,
    height: 175,
    borderRadius: 24,
    marginBottom: 12,
  },
  logoIconBg: {
    width: 80,
    height: 80,
    backgroundColor: '#FFB400',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2F2F2F',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: '#FFB400',
    backgroundColor: '#fff',
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerFocusedB2B: {
    borderColor: '#6366f1',
    backgroundColor: '#fff',
    shadowColor: '#6366f1',
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
    color: '#2F2F2F',
    fontSize: 15,
    outlineStyle: 'none',
  } as any,
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB400',
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 8,
    shadowColor: '#FFB400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginBtnText: {
    color: '#2F2F2F',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  demoCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a4800',
    marginBottom: 8,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: {
    fontSize: 12,
    color: '#5a4800',
    fontWeight: '600',
  },
  socialDivider: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginVertical: 24,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  socialBtnText: {
    fontSize: 14,
    color: '#2F2F2F',
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: '#FFB400',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalConfirmBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FFB400',
  },
  modalConfirmText: {
    color: '#2F2F2F',
    fontSize: 14,
    fontWeight: '700',
  },

  // Estilos de la simulación de OAuth
  oauthOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: 16,
  },
  oauthWindow: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  oauthBrowserHeader: {
    height: 44,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e2e2',
  },
  browserDots: {
    flexDirection: 'row',
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
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 4,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  browserClose: {
    padding: 4,
  },
  oauthScrollContent: {
    padding: 24,
  },
  oauthStepContainer: {
    width: '100%',
  },
  oauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: 4,
  },
  oauthSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  oauthAccountsList: {
    gap: 12,
  },
  oauthAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    gap: 16,
  },
  oauthAccountAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFB400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthAvatarText: {
    fontWeight: '700',
    color: '#2F2F2F',
    fontSize: 14,
  },
  oauthAccountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F2F2F',
  },
  oauthAccountEmail: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  oauthCustomEmailBox: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  oauthInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#2F2F2F',
    outlineStyle: 'none',
    width: '100%',
    marginBottom: 10,
  } as any,
  oauthInputFocused: {
    borderColor: '#6366f1',
    backgroundColor: '#fff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  oauthBtnPrimary: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthBtnSecondary: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthPermissionsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  oauthPermissionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  permissionText: {
    fontSize: 12,
    color: '#475569',
  },
  oauthLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  oauthLoadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  registerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: 6,
  },
  registerSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  rolesContainer: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: 10,
  },
  roleCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  roleCardActiveClient: {
    borderColor: '#FFB400',
    backgroundColor: '#fffbeb',
  },
  roleCardActiveProvider: {
    borderColor: '#FFB400',
    backgroundColor: '#f1f1f1',
  },
  roleCardActiveBusiness: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2F6',
  },
  roleTextActiveBusiness: {
    color: '#3730A3',
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2F2F',
    marginTop: 4,
  },
  roleTextActive: {
    color: '#5a4800',
  },
  roleTextActiveDark: {
    color: '#2F2F2F',
  },
  roleCardDesc: {
    fontSize: 12,
    color: '#666',
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  oauthBtnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  oauthBtnSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleRegisterBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleRegisterText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  entityToggleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  entityToggleBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  entityToggleActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  entityToggleText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  entityToggleActiveText: {
    color: '#fff',
  },
  rubroContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  rubroChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  rubroChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  rubroChipText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  rubroChipActiveText: {
    color: '#fff',
    fontWeight: '600',
  },
  purposeToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  purposeBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  purposeActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  purposeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  purposeActiveText: {
    color: '#fff',
    fontWeight: '600',
  },
});
