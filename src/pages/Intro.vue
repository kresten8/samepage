<template>
  <q-page>
    <div class="q-pa-lg" style="max-width: 60em; margin: auto">
      <div class="text-center q-pb-lg">
        <c-logo /><br />
        <div class="q-pt-sm">Connecting people and documents</div>
      </div>
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-sm-6">
          With this project we challenge you to tell us your dreams: What are the things you would like to do with documents from our collections?

          We have huge physical collections, which are true gold mines for people who are interested in history or language development, but most of these collections are paper based, in cellars, hard to access.

          By digitization we open them up, but we realize that the way how we do that, has a huge impact on what you, the end user, can do with it. Today users no longer just glance over images on screens: some already use AI algorithms to analyze thousands of documents, looking for patterns that otherwise would be impossible to find. Most digitized formats were never designed for that. In the past we focused on visual access not computer access.

          With digital documents, some functionalities are not coming from the file itself but from the ‘reading environment’. If you want to make your own annotations or links to information, you need more than just a view on a file. Functionalities like these also depend on properties of the content itself, so documents and reading environment should be designed together.
        </div>
        <div class="col-12 col-sm-6">
          The demonstrator on this web site is intended to inspire you. Not a finished product that we will release soon. With it you can look at scans of the originals, compare that with its digital sibling that was made by OCR. If you see mistakes you can correct those. You can adapt the digital version to your own likings: reflow it for a mobile screen, change the text styles or have it read aloud. People with a print impairment will be pleased to find all content very accessible.

          On top of the documents our environment will give you the possibilities to make your own annotations, share those with a friend or look at the annotations of an expert reader. We use layers to keep these separate. Layers can also be used to combine additional content: the audio of an audiobook version or a translation in another language.

          As a basis we are using ‘Web Publications’ a conceptual format envisioned by Markus Gyling and Ivan Herman to make ‘all kinds of publications first class citizens of the web’. By using open web technology instead of inventing yet another format, we hope implementation will be easier. Existing software, like web browsers and search engines should be usable.

          For questions you can contact Ted.vanderTogt@kb.nl
          </div>
        </div>
        <div class="text-center q-py-lg">
          <q-btn label="Open SamePage demonstrator" unelevated color="primary" :to="{ name: 'home' }"/>
        </div>
    </div>
  </q-page>
</template>

<script>
import cLogo from '../components/Logo'
export default {
  name: 'PageIntro',
  components: { cLogo },
  created () {
    this.$store.commit('settings/setIntroShown')
  },
  methods: {
    openHome () {
      this.$router.replace({ name: 'home' })
    }
  }
}
</script>
