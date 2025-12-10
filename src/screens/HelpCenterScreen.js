// src/screens/HelpCenterScreen.js

import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FAQ_DATA = [
  {
    id: "1",
    question: "How do I add my car?",
    answer: "From the Home screen, tap 'Scan My Car' to take a photo or upload an image of your vehicle. Fill in the details like year, make, model, and color, then tap 'Save & Set as My Car'.",
  },
  {
    id: "2",
    question: "What's the difference between Free, Pro, and Premium?",
    answer: "Free: 1 vehicle with dealer images. Pro ($9.99/mo): 1 vehicle with custom photos and full features. Premium ($19.99/mo): Unlimited vehicles, custom photos, and priority support.",
  },
  {
    id: "3",
    question: "How do I add parts to my inventory?",
    answer: "Go to Home > Add New Part, or tap the + button in the Inventory tab. Fill in the part details, add a photo if you'd like, and save.",
  },
  {
    id: "4",
    question: "Can I have multiple vehicles?",
    answer: "Multiple vehicles are available on the Premium plan. You can switch between vehicles from your Inventory screen.",
  },
  {
    id: "5",
    question: "How does the Try Mods feature work?",
    answer: "Try Mods lets you browse and select different modifications to see estimated costs. AR visualization is coming soon!",
  },
  {
    id: "6",
    question: "Is my data backed up?",
    answer: "Yes! All your data is securely stored in the cloud and synced across devices when you're signed in.",
  },
  {
    id: "7",
    question: "How do I cancel my subscription?",
    answer: "You can manage your subscription through your device's App Store (iOS) or Play Store (Android) settings.",
  },
  {
    id: "8",
    question: "Can I export my data?",
    answer: "Data export is available for Pro and Premium users. Go to Profile > Settings to export your vehicle and parts data.",
  },
];

export default function HelpCenterScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filteredFAQs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("ContactUs")}>
            <Text style={styles.quickLinkIcon}>💬</Text>
            <Text style={styles.quickLinkText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <Text style={styles.quickLinkIcon}>📺</Text>
            <Text style={styles.quickLinkText}>Video Tutorials</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {filteredFAQs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => toggleExpand(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqChevron}>
                  {expandedId === faq.id ? "−" : "+"}
                </Text>
              </View>
              {expandedId === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}

          {filteredFAQs.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </View>

        {/* Still Need Help */}
        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpText}>
            Our support team is here to assist you
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => navigation.navigate("ContactUs")}
          >
            <Text style={styles.contactButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#181818",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  quickLinks: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickLink: {
    flex: 1,
    backgroundColor: "#181818",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  quickLinkIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickLinkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  faqSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    paddingRight: 12,
  },
  faqChevron: {
    color: "#4a9eff",
    fontSize: 20,
    fontWeight: "700",
  },
  faqAnswer: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#282828",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noResultsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  noResultsSubtext: {
    color: "#888",
    fontSize: 14,
  },
  stillNeedHelp: {
    backgroundColor: "#181818",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  stillNeedHelpTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  stillNeedHelpText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: "#4a9eff",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

