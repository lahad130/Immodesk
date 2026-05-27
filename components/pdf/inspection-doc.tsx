import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

export interface InspectionDocProps {
  agency: { name: string; phone: string | null; city: string | null; country: string | null }
  property: { title: string; neighborhood: string | null; city: string } | null
  tenant: { full_name: string; phone: string | null } | null
  inspection: {
    id: string
    type: 'entree' | 'sortie' | string
    inspection_date: string
    notes: string | null
    photos: string[]
  }
}

function formatDatePDF(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getTypeConfig(type: string): { label: string; color: string } {
  switch (type) {
    case 'entree':
      return { label: 'ENTREE', color: '#3ECF8E' }
    case 'sortie':
      return { label: 'SORTIE', color: '#F59E0B' }
    default:
      return { label: type.toUpperCase(), color: '#888888' }
  }
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  agencyBlock: {
    flex: 1,
  },
  agencyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  agencyDetail: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 2,
  },
  refBlock: {
    alignItems: 'flex-end',
  },
  refLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 16,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 32,
  },
  column: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 10,
    marginBottom: 2,
    color: '#000000',
  },
  bodyTextBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    color: '#000000',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailKey: {
    fontSize: 10,
    color: '#666666',
    width: 120,
  },
  detailValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
  },
  observationsText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  observationsEmpty: {
    fontSize: 10,
    color: '#888888',
    fontStyle: 'italic',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  footer: {
    marginTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
})

export default function InspectionDoc(props: InspectionDocProps) {
  const { agency, property, tenant, inspection } = props
  const typeConfig = getTypeConfig(inspection.type)
  const photos = Array.isArray(inspection.photos) ? inspection.photos : []
  const shortId = inspection.id.slice(0, 8).toUpperCase()

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>{"RAPPORT D'ÉTAT DES LIEUX"}</Text>

        {/* Agency + Type/Ref */}
        <View style={styles.headerRow}>
          <View style={styles.agencyBlock}>
            <Text style={styles.agencyName}>{agency.name}</Text>
            {(agency.city || agency.country) ? (
              <Text style={styles.agencyDetail}>
                {[agency.city, agency.country].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {agency.phone ? (
              <Text style={styles.agencyDetail}>{agency.phone}</Text>
            ) : null}
          </View>
          <View style={styles.refBlock}>
            <Text style={[styles.refLabel, { color: typeConfig.color, fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 4 }]}>
              {typeConfig.label}
            </Text>
            <Text style={styles.refLabel}>Ref: {shortId}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bien + Locataire */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Bien</Text>
            {property ? (
              <>
                <Text style={styles.bodyTextBold}>{property.title}</Text>
                {(property.neighborhood || property.city) ? (
                  <Text style={styles.bodyText}>
                    {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.bodyText}>—</Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Locataire</Text>
            {tenant ? (
              <>
                <Text style={styles.bodyTextBold}>{tenant.full_name}</Text>
                {tenant.phone ? (
                  <Text style={styles.bodyText}>{tenant.phone}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.bodyText}>—</Text>
            )}
          </View>
        </View>

        {/* Date inspection */}
        <View style={{ marginTop: 12 }}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Date inspection :</Text>
            <Text style={styles.detailValue}>{formatDatePDF(inspection.inspection_date)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Observations */}
        <View>
          <Text style={styles.sectionLabel}>Observations</Text>
          {inspection.notes ? (
            <Text style={styles.observationsText}>{inspection.notes}</Text>
          ) : (
            <Text style={styles.observationsEmpty}>Aucune observation.</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Photos */}
        <View>
          <Text style={styles.sectionLabel}>
            Photos ({photos.length} photo{photos.length !== 1 ? 's' : ''})
          </Text>
          {photos.length > 0 ? (
            <View>
              {Array.from({ length: Math.ceil(photos.length / 2) }, (_, i) => (
                <View key={i} style={styles.photoRow}>
                  {[0, 1].map((j) => {
                    const url = photos[i * 2 + j]
                    return url ? (
                      <Image
                        key={j}
                        src={url}
                        style={{ width: '48%', height: 160, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <View key={j} style={{ width: '48%' }} />
                    )
                  })}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.observationsEmpty}>Aucune photo jointe.</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Document généré le {today}</Text>
        </View>
      </Page>
    </Document>
  )
}
