module.exports = {
  ios: {
    buildConfiguration: "Release",
    deploymentTarget: "16.0",
    useFrameworks: "static",
    otherCplusplusFlags: "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1"
  }
}; 