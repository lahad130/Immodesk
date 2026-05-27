import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface BailDocProps {
  agency: {
    name: string
    city: string | null
    country: string | null
    phone: string | null
    email: string | null
  }
  tenant: {
    full_name: string
    phone: string | null
    email: string | null
  }
  property: {
    title: string
    neighborhood: string | null
    city: string
    property_type: string | null
  } | null
  lease: {
    id: string
    start_date: string
    end_date: string
    monthly_rent: number
    deposit: number
  }
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function fmtFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingTop: 48,
    paddingBottom: 60,
    paddingLeft: 56,
    paddingRight: 56,
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#cccccc',
    marginVertical: 14,
  },
  articleTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 10,
  },
  articleBody: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  column: { flex: 1 },
  label: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  valueNormal: {
    fontSize: 10,
    marginBottom: 2,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  signatureBlock: {
    width: '40%',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 32,
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#333333',
    marginTop: 4,
  },
  signatureName: {
    fontSize: 9,
    color: '#666666',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
})

export default function BailDoc({ agency, tenant, property, lease }: BailDocProps) {
  const shortId = lease.id.slice(0, 8).toUpperCase()
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const durationMonths = Math.round(
    (new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) /
      (30.44 * 86_400_000)
  )
  const propertyDesc = [property?.title, property?.neighborhood, property?.city]
    .filter(Boolean)
    .join(', ')
  const propertyType = property?.property_type ?? 'bien'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <Text style={styles.title}>CONTRAT DE BAIL</Text>
        <Text style={styles.subtitle}>
          {`Établi conformément à la loi n° 77-60 du 22 juin 1977 portant statut des baux à usage d'habitation`}
          {`\net à usage professionnel au Sénégal — Réf. ${shortId}`}
        </Text>

        <View style={styles.divider} />

        {/* Parties */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.label}>Le Bailleur (représenté par)</Text>
            <Text style={styles.value}>{agency.name}</Text>
            {agency.city || agency.country ? (
              <Text style={styles.valueNormal}>
                {[agency.city, agency.country].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {agency.phone ? <Text style={styles.valueNormal}>{agency.phone}</Text> : null}
            {agency.email ? <Text style={styles.valueNormal}>{agency.email}</Text> : null}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Le Locataire</Text>
            <Text style={styles.value}>{tenant.full_name}</Text>
            {tenant.phone ? <Text style={styles.valueNormal}>{tenant.phone}</Text> : null}
            {tenant.email ? <Text style={styles.valueNormal}>{tenant.email}</Text> : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Article 1 */}
        <Text style={styles.articleTitle}>Article 1 — Désignation du bien loué</Text>
        <Text style={styles.articleBody}>
          {`Le bailleur donne à bail au locataire, qui accepte, le ${propertyType} sis à ${propertyDesc || 'adresse à préciser'}. Le bien est loué pour usage d'habitation exclusive, conformément à l'article 7 de la loi n° 77-60.`}
        </Text>

        {/* Article 2 */}
        <Text style={styles.articleTitle}>Article 2 — Durée du bail</Text>
        <Text style={styles.articleBody}>
          {`Le présent bail est consenti et accepté pour une durée de ${durationMonths} mois, prenant effet le ${fmt(lease.start_date)} et se terminant le ${fmt(lease.end_date)}. À l'expiration de ce terme, le bail sera reconduit tacitement par période d'un an, sauf congé donné par l'une des parties avec un préavis de trois (3) mois par lettre recommandée.`}
        </Text>

        {/* Article 3 */}
        <Text style={styles.articleTitle}>Article 3 — Loyer et modalités de paiement</Text>
        <Text style={styles.articleBody}>
          {`Le loyer mensuel est fixé à ${fmtFCFA(lease.monthly_rent)}, payable d'avance le premier de chaque mois. Tout retard de paiement de plus de quinze (15) jours entraînera une pénalité de 10% du loyer mensuel, conformément aux dispositions légales en vigueur. Le bailleur délivrera une quittance de loyer à chaque paiement.`}
        </Text>

        {/* Article 4 */}
        <Text style={styles.articleTitle}>Article 4 — Dépôt de garantie</Text>
        <Text style={styles.articleBody}>
          {lease.deposit > 0
            ? `Le locataire versera, à la signature des présentes, un dépôt de garantie de ${fmtFCFA(lease.deposit)}, équivalant à ${Math.round(lease.deposit / lease.monthly_rent)} mois de loyer. Cette somme sera restituée dans un délai de deux (2) mois suivant la restitution des clés, déduction faite des sommes dues au titre des dégradations éventuelles constatées à l'état des lieux de sortie.`
            : `Aucun dépôt de garantie n'est exigé dans le cadre du présent bail.`}
        </Text>

        {/* Article 5 */}
        <Text style={styles.articleTitle}>Article 5 — Obligations du locataire</Text>
        <Text style={styles.articleBody}>
          {`Le locataire s'engage à : (1) payer le loyer aux termes convenus ; (2) user paisiblement du bien loué conformément à sa destination ; (3) ne pas effectuer de travaux de transformation sans accord écrit du bailleur ; (4) permettre au bailleur d'effectuer les réparations urgentes ; (5) prendre en charge les menues réparations d'entretien courant ; (6) ne pas sous-louer sans accord écrit préalable.`}
        </Text>

        {/* Article 6 */}
        <Text style={styles.articleTitle}>Article 6 — Obligations du bailleur</Text>
        <Text style={styles.articleBody}>
          {`Le bailleur s'engage à : (1) délivrer le bien en bon état d'usage ; (2) assurer la jouissance paisible du bien ; (3) entretenir le bien en état de servir à l'usage pour lequel il a été loué ; (4) effectuer les réparations autres que locatives.`}
        </Text>

        {/* Article 7 */}
        <Text style={styles.articleTitle}>Article 7 — Résiliation</Text>
        <Text style={styles.articleBody}>
          {`En cas de non-paiement du loyer à l'échéance, le bailleur pourra, après mise en demeure restée sans effet pendant quinze (15) jours, résilier le présent bail de plein droit. La résiliation ne pourra être prononcée que par décision judiciaire conformément aux articles 28 et suivants de la loi n° 77-60. Tout litige sera soumis à la juridiction compétente du lieu de situation du bien.`}
        </Text>

        <View style={styles.divider} />

        {/* Fait à */}
        <Text style={[styles.articleBody, { marginBottom: 0 }]}>
          {`Fait à ${agency.city ?? 'Dakar'}, le ${today}, en deux (2) exemplaires originaux.`}
        </Text>

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Le Bailleur</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{agency.name}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Le Locataire</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{tenant.full_name}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {`Document généré le ${today} — Réf. ${shortId} — ImmoDesk`}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
