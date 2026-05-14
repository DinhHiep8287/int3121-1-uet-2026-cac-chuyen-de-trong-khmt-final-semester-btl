import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSizes, Spacing } from '../constants/theme'

export interface TranscriptSegment {
  id: string
  text: string
  resolvedCount: number
  unknownTerms: string[]
}

interface Props {
  segments: TranscriptSegment[]
}

export function TranscriptView({ segments }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Bản ghi</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {segments.length === 0 ? (
          <Text style={styles.placeholder}>Chưa có bản ghi. Nhấn Bắt đầu để nói.</Text>
        ) : (
          segments.map((seg) => (
            <View key={seg.id} style={styles.segment}>
              <Text style={styles.segmentText}>{seg.text}</Text>
              {seg.unknownTerms.length > 0 && (
                <Text style={styles.unknownText}>
                  Không nhận dạng: {seg.unknownTerms.join(', ')}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 8,
    overflow: 'hidden',
  },
  label: {
    backgroundColor: Colors.blue,
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  placeholder: {
    color: '#555555',
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  segment: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  segmentText: {
    color: Colors.white,
    fontSize: FontSizes.md,
  },
  unknownText: {
    color: '#FF6B6B',
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
})
