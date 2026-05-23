import { Pressable, StyleSheet, Text } from 'react-native';

export function ExampleButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
