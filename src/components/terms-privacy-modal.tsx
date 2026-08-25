import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'compliance';
}

export default function TermsPrivacyModal({ visible, onClose, initialTab = 'terms' }: TermsPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'compliance'>(initialTab);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header del Modal */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}> Marco Legal & Cumplimiento</Text>
              <Text style={styles.headerSubtitle}>Términos de Servicio y Protección de Datos Personales</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Selector de Pestañas (Términos vs Privacidad vs Cumplimiento) */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
              onPress={() => setActiveTab('terms')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
                Términos y Condiciones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
              onPress={() => setActiveTab('privacy')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
                Privacidad & Datos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'compliance' && styles.tabBtnActive]}
              onPress={() => setActiveTab('compliance')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'compliance' && styles.tabTextActive]}>
                App Store & GDPR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido Desplazable del Documento */}
          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={true}>
            {activeTab === 'terms' && (
              <View style={styles.textSection}>
                <Text style={styles.sectionHeading}>1. Naturaleza de la Plataforma</Text>
                <Text style={styles.paragraph}>
                  <Text style={{ fontWeight: 'bold' }}>Todo Ya</Text> es una aplicación tecnológica multiservicio de intermediación entre Usuarios Clientes (Particulares o Empresas B2B) y Proveedores Técnicos independientes. Todo Ya no es una empresa empleadora ni contratante directa de los proveedores, sino un facilitador tecnológico en tiempo real.
                </Text>

                <Text style={styles.sectionHeading}>2. Cuentas de Usuario y Tipos de Entidad</Text>
                <Text style={styles.paragraph}>
                  El registro admite Personas Naturales y Empresas con RUC o NIT. Los usuarios declaran proporcionar información veraz. La cuenta es personal e intransferible.
                </Text>

                <Text style={styles.sectionHeading}>3. Subasta Invertida B2B y Tarifas Residenciales</Text>
                <Text style={styles.paragraph}>
                  En solicitudes residenciales B2C, la plataforma aplica tarifas dinámicas de consulta según el tiempo y rango geográfico. En el segmento corporativo B2B, las empresas compradoras reciben una prueba inicial gratuita de 90 días para publicar requerimientos y recibir presupuestos o contraofertas en tiempo real.
                </Text>

                <Text style={styles.sectionHeading}>4. Sistema de Comisiones y Monedas</Text>
                <Text style={styles.paragraph}>
                  La plataforma opera un sistema de billetera virtual en monedas para el cobro de comisiones a los proveedores según su plan activo (Plan Básico: 20%, Plan Profesional: 10%, Plan Élite: 0%).
                </Text>

                <Text style={styles.sectionHeading}>5. Conducta y Denuncias de Usuarios</Text>
                <Text style={styles.paragraph}>
                  Cualquier cobro indebido, conducta inapropiada o incumplimiento dará lugar a denuncias formales, suspensión temporal de la cuenta o suspensión definitiva sin devolución de saldos.
                </Text>

                <Text style={styles.sectionHeading}>6. Deslinde de Responsabilidad por Hurtos, Robos, Daños y Negligencia</Text>
                <Text style={styles.paragraph}>
                  <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>EXENCIÓN Y DESLINDE LEGAL DE RESPONSABILIDAD DE TODO YA:</Text>{"\n\n"}
                  • <Text style={{ fontWeight: 'bold' }}>Independencia de las Partes</Text>: Los Proveedores Técnicos son profesionales independientes y no empleados, dependientes ni representantes de Todo Ya. La contratación del servicio constituye un acuerdo directo e independiente entre el Cliente y el Proveedor.{"\n\n"}
                  • <Text style={{ fontWeight: 'bold' }}>Ausencia de Responsabilidad por Delitos o Perjuicios</Text>: Todo Ya actúa únicamente como un canal tecnológico de conexión. Todo Ya <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>NO se hace responsable en ningún caso por robos, hurtos, sustracciones de bienes, extravíos, cobros excesivos, fraudes, estafas, negligencia, mala praxis técnica ni daños materiales o morales</Text> causados por proveedores o clientes dentro o fuera del domicilio o local de atención.{"\n\n"}
                  • <Text style={{ fontWeight: 'bold' }}>Responsabilidad Penal y Civil Directa</Text>: La responsabilidad civil y penal por cualquier ilícito o daño recae de forma exclusiva sobre la persona natural o jurídica que cometa la infracción o delito.{"\n\n"}
                  • <Text style={{ fontWeight: 'bold' }}>Verificación KYC y Colaboración con las Autoridades (PNP)</Text>: Aunque Todo Ya implementa la verificación de identidad (DNI / CE y selfie biométrica con IA), esto constituye una medida preventiva de seguridad y no una garantía de conducta. Ante la denuncia o comisión de un delito, Todo Ya inhabilitará inmediatamente la cuenta y <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>proporcionará de forma prioritaria la identidad y datos registrados del infractor a la Policía Nacional del Perú (PNP), Ministerio Público o Autoridad Judicial competente</Text> que lo solicite mediante mandato oficial.
                </Text>
              </View>
            )}

            {activeTab === 'privacy' && (
              <View style={styles.textSection}>
                <Text style={styles.sectionHeading}>1. Información Recopilada</Text>
                <Text style={styles.paragraph}>
                  Para el correcto funcionamiento de los servicios en tiempo real, recopilamos:
                </Text>
                <Text style={styles.bulletItem}>• Datos de identificación: Nombre completo, correo electrónico y número de celular.</Text>
                <Text style={styles.bulletItem}>• Ubicación geográfica precisa (GPS) para emparejamiento con proveedores cercanos.</Text>
                <Text style={styles.bulletItem}>• Documentos de identidad y selfie facial (Proceso de verificación de identidad KYC para proveedores).</Text>

                <Text style={styles.sectionHeading}>2. Uso de la Información</Text>
                <Text style={styles.paragraph}>
                  La información recopilada se utiliza exclusivamente para:
                </Text>
                <Text style={styles.bulletItem}>• Conectar solicitudes de clientes con proveedores calificados dentro de un radio de 5 km.</Text>
                <Text style={styles.bulletItem}>• Garantizar la seguridad física y comercial de las partes (prevención de fraudes y KYC).</Text>
                <Text style={styles.bulletItem}>• Emitir notificaciones de estado sobre pedidos y recargas de saldo.</Text>

                <Text style={styles.sectionHeading}>3. Almacenamiento Seguro y Protección de Datos</Text>
                <Text style={styles.paragraph}>
                  Toda la información se transmite mediante canales encriptados SSL/TLS y se almacena en bases de datos PostgreSQL securizadas con políticas de control de acceso estricto.
                </Text>

                <Text style={styles.sectionHeading}>4. Período de Modificación de Datos Personales (30 Días)</Text>
                <Text style={styles.paragraph}>
                  Por razones de seguridad y prevención de suplantaciones de identidad, la modificación del Nombre, Correo o Celular en el perfil está sujeta a un período de carencia de 30 días entre cambios.
                </Text>
              </View>
            )}

            {activeTab === 'compliance' && (
              <View style={styles.textSection}>
                <Text style={styles.sectionHeading}>1. Cumplimiento de la Guía 5.1.1 de Apple App Store</Text>
                <Text style={styles.paragraph}>
                  En cumplimiento estricto de las directrices de privacidad de la App Store y Google Play Store:
                </Text>

                <Text style={styles.subHeading}>Eliminación Definitiva de Cuenta e Historial (App Store 5.1.1 v):</Text>
                <Text style={styles.paragraph}>
                  Cualquier usuario puede solicitar la eliminación definitiva de su cuenta, perfil, historial de transacciones y datos personales almacenados en cualquier momento directamente desde la opción <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>"Eliminar Cuenta"</Text> en el menú de Perfil, o enviando una solicitud formal a <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>todoo.yap@gmail.com</Text>. La eliminación de datos se procesa de forma irreversible.
                </Text>

                <Text style={styles.subHeading}>Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición):</Text>
                <Text style={styles.paragraph}>
                  Los usuarios conservan en todo momento sus derechos de acceso y rectificación sobre sus datos personales recopilados.
                </Text>

                <Text style={styles.sectionHeading}>2. Delegado de Protección de Datos (DPO)</Text>
                <Text style={styles.paragraph}>
                  Para cualquier consulta legal, sugerencias o ejercicios de derechos de privacidad:
                  {"\n"}Correo de soporte oficial: <Text style={{ fontWeight: 'bold', color: '#e1306c' }}>todoo.yap@gmail.com</Text>
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer del Modal */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.acceptBtnText}>Entendido y Aceptado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 50 : 30,
  },
  container: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bodyScroll: {
    flex: 1,
    marginBottom: 16,
  },
  textSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginTop: 10,
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
    marginLeft: 6,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  acceptBtn: {
    height: 46,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
