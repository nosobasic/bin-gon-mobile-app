import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { SearchBar } from '../components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { useData } from '../contexts/DataContext';

interface CommunityScreenProps {
  navigation: NavigationProp;
}

const CommunityScreen: React.FC<CommunityScreenProps> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const { stories, loadingStories } = useData();

  const handleStoryPress = (storyId: string) => {
    // Navigate to story detail screen
    console.log('Story pressed:', storyId);
  };

  // Filter stories based on search text
  const filteredStories = stories.filter(story => {
    // Debug: Log story data
    console.log('🔍 Story data:', { id: story.id, title: story.title, published: story.published });
    return story.title.toLowerCase().includes(searchText.toLowerCase()) ||
           story.body.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Community Stories" 
        onBackPress={() => navigation.goBack()}
      />
      
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search here..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Stories Feed */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingStories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading stories...</Text>
          </View>
        ) : filteredStories.length > 0 ? (
          filteredStories.map((story, index) => {
            // Debug: Check if story has valid ID
            if (!story.id) {
              console.warn('⚠️ Story without ID found:', story);
            }
            return (
            <TouchableOpacity
              key={story.id || `story-${index}`}
              style={styles.storyCard}
              onPress={() => handleStoryPress(story.id)}
              activeOpacity={0.8}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={
                    story.images && story.images[0] 
                      ? { uri: story.images[0] } 
                      : require('../assets/images/community1.png')
                  } 
                  style={styles.storyImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.storyContent}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyDescription}>
                  {story.body.length > 120 ? `${story.body.substring(0, 120)}...` : story.body}
                </Text>
                <View style={styles.readMoreContainer}>
                  <Text style={styles.readMoreText}>Read more</Text>
                  <Image 
                    source={require('../assets/images/right.png')}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No community stories found</Text>
            <Text style={styles.emptySubText}>
              {searchText ? 'Try a different search term' : 'Stories will appear here when they are published'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchSection: {},
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    marginBottom: wp(20)
  },
  storyCard: {
    width: wp(90),
    padding: wp(5),
    paddingBottom: wp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    backgroundColor: "#F6F6F6",
  },
  imageContainer: {
    width: wp(80),
    height: wp(47),
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(4),
  },
  storyContent: {
    paddingTop: wp(4),
    paddingBottom: wp(2),
  },
  storyTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.text.black,
    marginBottom: wp(2),
  },
  storyDescription: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    lineHeight: wp(5.5),
    marginBottom: wp(3),
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.primary,
    marginRight: wp(2.5),
  },
  arrowIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: wp(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(10),
  },
  emptyText: {
    fontSize: wp(4.5),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.text.black,
    textAlign: 'center',
    marginBottom: wp(2),
  },
  emptySubText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    textAlign: 'center',
    lineHeight: wp(5),
  },
});

export default CommunityScreen; 